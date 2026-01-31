import { User } from "../../user/entities/user.entity";
import AppDataSource from "../../data-source";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/token";
import { LoginRespDto } from "../dtoes/login.dto";
import { Otp } from "../../user/entities/otp.entity";
import { OtpType } from "../../utils/enums";
import { ConfigService } from "../../config/services/config.service";
import { sendOtpEmail } from "../../utils/otp/sendEmailOtp";
import { sendSmsOtp } from "../../utils/otp/sendSmsOtp";
import { MoreThan, In } from "typeorm";
import logger from "../../utils/logger";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async login(username: string, password: string): Promise<LoginRespDto | null> {
    const user = await this.userRepo.findOneBy({ username });
    if (!user || user.isDeleted) return null;
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await this.userRepo.save(user);

    const token = signToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    return { authToken: token };
  };

  /**
   * Admin-only login - restricts login to users with admin role
   */
  async adminLogin(username: string, password: string): Promise<LoginRespDto | null> {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: { role: true }
    });
    
    if (!user || user.isDeleted) return null;
    
    // Check if user has admin role
    if (!user.role || user.role.name !== "admin") {
      return null; // Return null instead of throwing to maintain same error handling pattern
    }
    
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await this.userRepo.save(user);

    const token = signToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    return { authToken: token };
  };

  async verifyOtp(user: User, code: string): Promise<boolean> {
    const otpRepo = AppDataSource.getRepository(Otp);
    const destinations = [user.phoneNumber, user.email].filter(Boolean);

    // Find the most recent unused OTP matching the code and user's phone/email
    const otp = await otpRepo.findOne({
      where: {
        code,
        destination: destinations.length > 1 ? In(destinations) : destinations[0],
        isUsed: false,
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: "DESC" }
    });

    if (!otp) return false;

    otp.isUsed = true;
    await otpRepo.save(otp);

    // Update user verification status based on OTP type
    if (otp.type === OtpType.SMS && otp.destination === user.phoneNumber) {
      user.verifiedViaSms = true;
    } else if (otp.type === OtpType.EMAIL && otp.destination === user.email) {
      user.verifiedViaEmail = true;
    }
    await this.userRepo.save(user);

    return true;
  }

  /**
   * Public OTP verification for registration (doesn't require authentication)
   * Accepts phoneNumber or email + OTP code
   */
  async verifyOtpPublic(phoneNumber?: string, email?: string, code?: string): Promise<{ verified: boolean; user?: User }> {
    if (!code || (!phoneNumber && !email)) {
      return { verified: false };
    }

    const otpRepo = AppDataSource.getRepository(Otp);
    const destination = phoneNumber || email;

    if (!destination) {
      return { verified: false };
    }

    // Find the most recent unused OTP matching the code and destination
    const otp = await otpRepo.findOne({
      where: {
        code,
        destination,
        isUsed: false,
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: "DESC" }
    });

    if (!otp) {
      return { verified: false };
    }

    // Find user by phoneNumber or email
    const user = await this.userRepo.findOne({
      where: phoneNumber 
        ? { phoneNumber } 
        : { email }
    });

    if (!user) {
      return { verified: false };
    }

    // Mark OTP as used
    otp.isUsed = true;
    await otpRepo.save(otp);

    // Update user verification status based on OTP type
    if (otp.type === OtpType.SMS && phoneNumber) {
      user.verifiedViaSms = true;
    } else if (otp.type === OtpType.EMAIL && email) {
      user.verifiedViaEmail = true;
    }
    await this.userRepo.save(user);

    return { verified: true, user };
  }

  async sendOtp(user?: User, context: string = "default"): Promise<{ destination: string, otpType: string, code?: string }> {
    const configService = new ConfigService();
    const otpRepo = AppDataSource.getRepository(Otp);

    // Get OTP config from the new config system
    const otpConfig = await configService.get("otp_config");
    const smsActive = otpConfig?.sms ?? false;
    const emailActive = otpConfig?.email ?? true;

    const phoneNumber = user?.phoneNumber;
    const email = user?.email;

    let otpType: OtpType | null = null;
    let destination: string | undefined = undefined;

    if (context === "resetPassword" && user) {
      if (user.verifiedViaEmail && emailActive && email) {
        otpType = OtpType.EMAIL;
        destination = email;
      } else if (!user.verifiedViaEmail && user.verifiedViaSms && smsActive && phoneNumber) {
        otpType = OtpType.SMS;
        destination = phoneNumber;
        user.forceVerifyViaEmail = true;
        await this.userRepo.save(user);
      } else {
        throw new Error("No verified channel for password reset.");
      }
    } else {
      if (smsActive && phoneNumber) {
        otpType = OtpType.SMS;
        destination = phoneNumber;
      } else if (emailActive && email) {
        otpType = OtpType.EMAIL;
        destination = email;
      } else {
        throw new Error("No active OTP method or valid destination provided.");
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = otpRepo.create({
      destination,
      code,
      type: otpType,
      isUsed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      user: user, // Link OTP to user for easier lookup
    });
    await otpRepo.save(otp);

    if (otpType === OtpType.SMS) {
      try {
        const smsNumber = destination.startsWith("252") ? destination.substring(3) : destination;
        await sendSmsOtp(smsNumber, code);
        logger.info({ destination, type: "SMS" }, "OTP sent via SMS");
      } catch (err: any) {
        logger.error({ err: err?.response?.data || err?.message || err, destination }, "Failed to send OTP SMS");

        if (emailActive && email) {
          try {
            await sendOtpEmail(email, code, user);
            otp.destination = email;
            otp.type = OtpType.EMAIL;
            await otpRepo.save(otp);
            return { destination: email, otpType: OtpType.EMAIL, code };
          } catch (emailErr) {
            otp.isUsed = true;
            await otpRepo.save(otp);
            throw new Error("Failed to send OTP SMS and fallback Email.");
          }
        } else {
          otp.isUsed = true;
          await otpRepo.save(otp);
          throw new Error("Failed to send OTP SMS.");
        }
      }
    } else if (otpType === OtpType.EMAIL) {
      try {
        await sendOtpEmail(destination, code, user);
      } catch (err) {
        otp.isUsed = true;
        await otpRepo.save(otp);
        throw new Error("Failed to send OTP Email.");
      }
    }

    if (process.env.NODE_ENV === "production") {
      return { destination, otpType };
    }

    return { destination, otpType, code }; // Include code for dev/testing
  };

  async confirmResetPassword(user: User, code: string, newPassword: string): Promise<void> {
    const otpRepo = AppDataSource.getRepository(Otp);
    const userRepo = AppDataSource.getRepository(User);

    const destinations = [user.phoneNumber, user.email].filter(Boolean);

    const existingOtp = await otpRepo.findOne({
      where: {
        destination: destinations.length > 1 ? In(destinations) : destinations[0],
        code: code,
        isUsed: false,
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: "DESC" }
    });

    if (!existingOtp) {
      throw new Error("Invalid or expired OTP.");
    }

    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new Error("You cannot reuse your old password.");
    }

    const hashed = await hashPassword(newPassword);

    user.passwordHash = hashed;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await userRepo.save(user);

    existingOtp.isUsed = true;
    await otpRepo.save(existingOtp);
  };

  async logout(user: User): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    user.tokenVersion += 1;
    await userRepo.save(user);
  }
}
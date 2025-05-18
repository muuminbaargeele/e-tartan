import { User } from "../../user/entities/user.entity";
import AppDataSource from "../../data-source";
import { verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/token";
import { LoginRespDto } from "../dtoes/login.dto";
import { Otp } from "../../user/entities/otp.entity";
import { OtpType } from "../../utils/enums";
import { SysConfig } from "../../utils/entities/sysconfig.entity";
import { sendOtpEmail } from "../../utils/sendEmailOtp";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async login(username: string, password: string): Promise<LoginRespDto | null> {
    const user = await this.userRepo.findOneBy({ username });
    if (!user) return null;
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

    const possibleDestinations = [user.phoneNumber, user.email].filter(Boolean);

    // Find the most recent unused OTP matching the code and one of the user's destinations
    const otp = await otpRepo.findOne({
      where: {
        code,
        destination: possibleDestinations.length === 1 ? possibleDestinations[0] : undefined,
        isUsed: false,
      },
      order: { createdAt: "DESC" }
    });

    if (!otp) return false;

    if (otp.expiresAt && new Date() > otp.expiresAt) return false;

    otp.isUsed = true;
    await otpRepo.save(otp);

    return true;
  }

  async sendOtp(user?: User): Promise<{ destination: string, otpType: string, code?: string }> {
    const sysConfigRepo = AppDataSource.getRepository(SysConfig);
    const otpRepo = AppDataSource.getRepository(Otp);

 
    const smsActive = await sysConfigRepo.findOneBy({ key: "isSmsOtpActive" });
    const emailActive = await sysConfigRepo.findOneBy({ key: "isEmailOtpActive" });


    const phoneNumber = user?.phoneNumber
    const email = user?.email

    let otpType: OtpType | null = null;
    let destination: string | undefined = undefined;

    if (smsActive?.value === "true" && phoneNumber) {
      otpType = OtpType.SMS;
      destination = phoneNumber;
    } else if (emailActive?.value === "true" && email) {
      otpType = OtpType.EMAIL;
      destination = email;
    } else {
      throw new Error("No active OTP method or valid destination provided.");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = otpRepo.create({
      destination,
      code,
      type: otpType,
      isUsed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    });
    await otpRepo.save(otp);

    if (otpType === OtpType.EMAIL) {
      try {
        await sendOtpEmail(destination, code);
      } catch (err) {
        otp.isUsed = true;
        await otpRepo.save(otp);
        throw new Error("Failed to send OTP email.");
      }
    }
    // (For SMS: add SMS sending logic here in the future)
    
    return { destination, otpType, code }; // For Dev
    // return { destination, otpType };
  }

}
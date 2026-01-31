import { User } from "../entities/user.entity";
import { UserProfileDto } from "../dtoes/userProfile.dto";
import AppDataSource from "../../data-source";
import { PlayerProfileDto } from "src/player/dtoes/playerProfile.dto";
import { Player } from "../../player/entities/player.entity";
import { hashPassword, verifyPassword } from "../../utils/password";
import { CreateUserDto } from "../dtoes/createUser.dto";
import { UpdateUserProfileDto } from "../dtoes/updateUserProfile.dto";
import { Role } from "../entities/role.entity";
import { AuthService } from "../../auth/services/auth.service";
import { Otp } from "../entities/otp.entity";
import { OtpType } from "../../utils/enums";
import { MoreThan, In } from "typeorm";
import logger from "../../utils/logger";
import { domainToASCII } from "url";

const authService = new AuthService();

export class UserService {
    async getProfile(dbuser: User): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: dbuser.id },
            relations: { role: true, player: true }
        });

        if (!user || user.isDeleted) {
            throw new Error("User not found");
        }

        let calculatedCompleteProfile =
            !!(user.firstName && user.lastName && user.email);

        if (user.role?.name === "player") {
            calculatedCompleteProfile =
                calculatedCompleteProfile &&
                !!(user.player?.efootballId && user.player?.efootballUsername);
        }

        if (user.hasCompleteProfile !== calculatedCompleteProfile) {
            user.hasCompleteProfile = calculatedCompleteProfile;
            await userRepo.save(user);
        }



        let profile: UserProfileDto = {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            email: user.email,
            role: user.role?.name,
            hasCompleteProfile: calculatedCompleteProfile
        };

        if (user.role?.name === "player" && user.player) {
            const playerProfile: PlayerProfileDto = {
                playerId: user.player.id,
                efootballId: user.player.efootballId,
                efootballUsername: user.player.efootballUsername,
                efootballTeamName: user.player.efootballTeamName
            };
            profile.playerProfile = playerProfile;
        }

        return profile;
    }

    async createUser(dto: CreateUserDto): Promise<{ user: User, otpType: string }> {
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);

        const existingUsernameUser = await userRepo.findOneBy({ username: dto.username });
        if (existingUsernameUser) {
            throw new Error("Username already exists");
        }
        const existingEmailUser = await userRepo.findOneBy({ email: dto.email });
        if (existingEmailUser) {
            throw new Error("Email already exists");
        }
        const existingPhoneUser = await userRepo.findOneBy({ phoneNumber: dto.phoneNumber });
        if (existingPhoneUser) {
            throw new Error("Phone number already exists");
        }

        let roleName = dto.role ? dto.role : "player";
        let role = await roleRepo.findOneBy({ name: roleName });
        if (!role) throw new Error(`${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role not found`);

        let username = dto.username;
        let hasCompleteProfile = true
        if (role.name === "player") {
            username = dto.phoneNumber;
            hasCompleteProfile = false
        }

        const user = userRepo.create({
            ...dto,
            username,
            passwordHash: await hashPassword(dto.password),
            role,
            isActive: true,
            tokenVersion: 0,
            hasCompleteProfile: hasCompleteProfile
        });

        const savedUser = await userRepo.save(user);

        let otpResult: any;
        try {
            otpResult = await authService.sendOtp(savedUser);
        } catch (err) {
            await userRepo.delete(savedUser.id);  // Clean up
            throw new Error("Failed to send OTP."); // or err.message if you want details
        }

        return { user: savedUser, otpType: otpResult.otpType };
    };

    async updateProfile(dbuser: User, dto: UpdateUserProfileDto): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);
        const playerRepo = AppDataSource.getRepository(Player);

        // Get fresh user data with relations
        const user = await userRepo.findOne({
            where: { id: dbuser.id },
            relations: { role: true, player: true }
        });

        if (!user || user.isDeleted) {
            throw new Error("User not found");
        }

        // Check for email uniqueness if email is being updated
        if (dto.email && dto.email !== user.email) {
            const existingEmailUser = await userRepo.findOneBy({ email: dto.email });
            if (existingEmailUser) {
                throw new Error("Email already exists");
            }
        }

        // Update user fields if provided
        if (dto.firstName !== undefined) user.firstName = dto.firstName;
        if (dto.middleName !== undefined) user.middleName = dto.middleName;
        if (dto.lastName !== undefined) user.lastName = dto.lastName;
        if (dto.email !== undefined) user.email = dto.email;

        await userRepo.save(user);

        // Handle player profile updates if user is a player
        if (user.role?.name === "player") {
            // Check if player profile exists
            if (!user.player) {
                throw new Error("Player profile not found. Please create player profile first.");
            }

            const player = await playerRepo.findOneBy({ id: user.player.id });
            if (!player) {
                throw new Error("Player profile not found");
            }

            // Check for efootballId uniqueness if being updated
            if (dto.efootballId && dto.efootballId !== player.efootballId) {
                const existingEfootballId = await playerRepo.findOneBy({ efootballId: dto.efootballId });
                if (existingEfootballId) {
                    throw new Error("eFootball ID is already used by another player");
                }
            }

            // Check for efootballUsername uniqueness if being updated
            if (dto.efootballUsername && dto.efootballUsername !== player.efootballUsername) {
                const existingEfootballUsername = await playerRepo.findOneBy({ efootballUsername: dto.efootballUsername });
                if (existingEfootballUsername) {
                    throw new Error("eFootball Username is already used by another player");
                }
            }

            // Update player fields if provided
            if (dto.efootballId !== undefined) player.efootballId = dto.efootballId;
            if (dto.efootballUsername !== undefined) player.efootballUsername = dto.efootballUsername;
            if (dto.efootballTeamName !== undefined) player.efootballTeamName = dto.efootballTeamName;
            if (dto.avatarUrl !== undefined) player.avatarUrl = dto.avatarUrl;

            await playerRepo.save(player);
        } else {
            // If user is not a player but trying to update player fields
            if (dto.efootballId || dto.efootballUsername || dto.efootballTeamName || dto.avatarUrl) {
                throw new Error("Only players can update eFootball profile information");
            }
        }

        // Return updated profile using the same getProfile logic
        return await this.getProfile(user);
    }

    async changePassword(user: User, currentPassword: string, newPassword: string): Promise<void> {
        const userRepo = AppDataSource.getRepository(User);

        // Get fresh user data
        const dbUser = await userRepo.findOneBy({ id: user.id });
        if (!dbUser || dbUser.isDeleted) {
            throw new Error("User not found");
        }

        // Verify current password
        if (!dbUser.passwordHash) {
            throw new Error("User has no password set");
        }

        const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
        if (!isValid) {
            throw new Error("Current password is incorrect");
        }

        // Check if new password is same as current
        const isSamePassword = await verifyPassword(newPassword, dbUser.passwordHash);
        if (isSamePassword) {
            throw new Error("New password must be different from current password");
        }

        // Update password and invalidate all tokens
        dbUser.passwordHash = await hashPassword(newPassword);
        dbUser.tokenVersion = (dbUser.tokenVersion || 0) + 1;
        await userRepo.save(dbUser);
    }

    async requestPhoneUpdateOtp(newPhoneNumber: string): Promise<{ destination: string, otpType: string, code?: string }> {
        const otpRepo = AppDataSource.getRepository(Otp);
        const { sendSmsOtp } = require("../../utils/otp/sendSmsOtp");
        const { ConfigService } = require("../../config/services/config.service");
        const configService = new ConfigService();

        // Check if SMS OTP is active from config
        const otpConfig = await configService.get("otp_config");
        const smsActive = otpConfig?.sms ?? false;
        if (!smsActive) {
            throw new Error("SMS OTP is not active");
        }

        // Check if phone number already exists
        const userRepo = AppDataSource.getRepository(User);
        const existingPhoneUser = await userRepo.findOneBy({ phoneNumber: newPhoneNumber });
        if (existingPhoneUser) {
            throw new Error("Phone number already exists");
        }

        // Generate OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Create OTP record
        const otp = otpRepo.create({
            destination: newPhoneNumber,
            code,
            type: OtpType.SMS,
            isUsed: false,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        });
        await otpRepo.save(otp);

        // Send SMS OTP
        try {
            const smsNumber = newPhoneNumber.startsWith("252") ? newPhoneNumber.substring(3) : newPhoneNumber;
            await sendSmsOtp(smsNumber, code);
        } catch (err) {
            otp.isUsed = true;
            await otpRepo.save(otp);
            throw new Error("Failed to send OTP SMS");
        }

        if (process.env.NODE_ENV === "production") {
            return { destination: newPhoneNumber, otpType: OtpType.SMS };
        }

        return { destination: newPhoneNumber, otpType: OtpType.SMS, code }; // Include code for dev/testing
    }

    async updatePhoneNumber(user: User, newPhoneNumber: string, otpCode: string): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);
        const otpRepo = AppDataSource.getRepository(Otp);

        // Get fresh user data
        const dbUser = await userRepo.findOne({
            where: { id: user.id },
            relations: { role: true, player: true }
        });

        if (!dbUser || dbUser.isDeleted) {
            throw new Error("User not found");
        }

        // Check if new phone number is different
        if (newPhoneNumber === dbUser.phoneNumber) {
            throw new Error("New phone number must be different from current phone number");
        }

        // Check if phone number already exists
        const existingPhoneUser = await userRepo.findOneBy({ phoneNumber: newPhoneNumber });
        if (existingPhoneUser) {
            throw new Error("Phone number already exists");
        }

        // Verify OTP for the new phone number
        const otp = await otpRepo.findOne({
            where: {
                destination: newPhoneNumber,
                code: otpCode,
                isUsed: false,
                expiresAt: MoreThan(new Date()),
                type: OtpType.SMS
            },
            order: { createdAt: "DESC" }
        });

        if (!otp) {
            throw new Error("Invalid or expired OTP code");
        }

        // Mark OTP as used
        otp.isUsed = true;
        await otpRepo.save(otp);

        // Update phone number
        const oldPhoneNumber = dbUser.phoneNumber;
        dbUser.phoneNumber = newPhoneNumber;
        
        // If username was the old phone number (for players), update it too
        if (dbUser.role?.name === "player" && dbUser.username === oldPhoneNumber) {
            dbUser.username = newPhoneNumber;
        }

        // Reset SMS verification since phone number changed
        dbUser.verifiedViaSms = false;
        
        await userRepo.save(dbUser);

        // Return updated profile
        return await this.getProfile(dbUser);
    }

    async updateUsername(user: User, newUsername: string): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);

        // Get fresh user data
        const dbUser = await userRepo.findOne({
            where: { id: user.id },
            relations: { role: true, player: true }
        });

        if (!dbUser || dbUser.isDeleted) {
            throw new Error("User not found");
        }

        // Check if new username is different
        if (newUsername === dbUser.username) {
            throw new Error("New username must be different from current username");
        }

        // Check if username already exists
        const existingUsernameUser = await userRepo.findOneBy({ username: newUsername });
        if (existingUsernameUser) {
            throw new Error("Username already exists");
        }

        // For players, username is typically their phone number, so prevent changing it
        if (dbUser.role?.name === "player") {
            throw new Error("Players cannot change their username. Username is linked to phone number.");
        }

        // Update username
        dbUser.username = newUsername;
        await userRepo.save(dbUser);

        // Return updated profile
        return await this.getProfile(dbUser);
    }

    async toggleAccountActivation(user: User, activate: boolean): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);

        // Get fresh user data
        const dbUser = await userRepo.findOne({
            where: { id: user.id },
            relations: { role: true, player: true }
        });

        if (!dbUser || dbUser.isDeleted) {
            throw new Error("User not found");
        }

        // Update activation status
        dbUser.isActive = activate;

        // If deactivating, invalidate all tokens
        if (!activate) {
            dbUser.tokenVersion = (dbUser.tokenVersion || 0) + 1;
        }

        await userRepo.save(dbUser);

        // Return updated profile
        return await this.getProfile(dbUser);
    }

    async deleteAccount(user: User): Promise<void> {
        const userRepo = AppDataSource.getRepository(User);
        user.isDeleted = true;
        user.tokenVersion = 0;
        await userRepo.save(user);
    }

}
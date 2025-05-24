import { User } from "../entities/user.entity";
import { UserProfileDto } from "../dtoes/userProfile.dto";
import AppDataSource from "../../data-source";
import { PlayerProfileDto } from "src/player/dtoes/playerProfile.dto";
import { hashPassword } from "../../utils/password";
import { CreateUserDto } from "../dtoes/createUser.dto";
import { Role } from "../entities/role.entity";
import { AuthService } from "../../auth/services/auth.service";

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

    async deleteAccount(user: User): Promise<void> {
        const userRepo = AppDataSource.getRepository(User);
        user.isDeleted = true;
        user.tokenVersion = 0;
        await userRepo.save(user);
    }

}
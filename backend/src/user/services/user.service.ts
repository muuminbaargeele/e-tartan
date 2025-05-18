import { User } from "../entities/user.entity";
import { UserProfileDto } from "../dtoes/userProfile.dto";
import AppDataSource from "../../data-source";
import { PlayerProfileDto } from "src/player/dtoes/playerProfile.dto";
import { hashPassword } from "../../utils/password";
import { CreateUserDto } from "../dtoes/createUser.dto";
import { Role } from "../entities/role.entity";
import { AuthService } from "../../auth/services/auth.service";

export class UserService {
    async getProfile(dbuser: User): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: dbuser.id },
            relations: { role: true, player: true }
        });

        let hasCompleteProfile: boolean =
            !!(user.firstName && user.lastName && user.email);

        if (user.role?.name === "player") {
            hasCompleteProfile =
                hasCompleteProfile &&
                !!(user.player?.efootballId && user.player?.efootballUsername);
        }



        let profile: UserProfileDto = {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            email: user.email,
            role: user.role?.name,
            hasCompleteProfile: hasCompleteProfile
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

    async createUser(dto: CreateUserDto): Promise<User> {
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);

        // Check for existing username/email/phone
        if (await userRepo.findOneBy({ username: dto.username })) {
            throw new Error("Username already exists");
        }
        if (await userRepo.findOneBy({ email: dto.email })) {
            throw new Error("Email already exists");
        }
        if (await userRepo.findOneBy({ phoneNumber: dto.phoneNumber })) {
            throw new Error("Phone number already exists");
        }

        // Assign role (use dto.role if provided, else default to 'player')
        let roleName = dto.role ? dto.role : "player";
        let role = await roleRepo.findOneBy({ name: roleName });
        if (!role) throw new Error(`${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role not found`);

        let username = dto.username;
        if (role.name === "player") {
            username = dto.phoneNumber;
        }

        // Create user
        const user = userRepo.create({
            ...dto,
            username,
            passwordHash: await hashPassword(dto.password),
            role,
            isActive: true,
            tokenVersion: 0,
        });

        const authService = new AuthService(); // or inject
        await authService.sendOtp(
            user
        );

        return await userRepo.save(user);
    }

}
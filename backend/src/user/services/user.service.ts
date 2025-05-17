import { User } from "../entities/user.entity";
import { UserProfileDto } from "../dtoes/userProfile.dto";
import AppDataSource from "../../data-source";
import { PlayerProfileDto } from "src/player/dtoes/playerProfile.dto";

export class UserService {
    async getProfile(dbuser: User): Promise<UserProfileDto> {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: dbuser.id },
            relations: { role: true, player: true }
        });

        let profile: UserProfileDto = {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            email: user.email,
            role: user.role?.name,
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
}
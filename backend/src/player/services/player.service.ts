import { Player } from "../entities/player.entity";
import AppDataSource from "../../data-source";
import { User } from "../../user/entities/user.entity";
import { CreatePlayerProfileDto } from "../dtoes/createPlayerProfile.dto";
import { PlayerProfileDto } from "../dtoes/playerProfile.dto";
import logger from "../../utils/logger";

export class PlayerService {
    async createPlayerProfile(user: User, dto: CreatePlayerProfileDto): Promise<Player> {
        const playerRepo = AppDataSource.getRepository(Player);
        const userRepo = AppDataSource.getRepository(User);

        // 1. Only players can have a player profile
        if (!user.role || user.role.name !== "player") {
            throw new Error("Only users with player role can create a player profile.");
        }

        // 2. Prevent duplicate
        const existing = await playerRepo.findOneBy({ user: { id: user.id } });
        if (existing) {
            throw new Error("Player profile already exists.");
        }

        // 3. Prevent duplicate efootballId
        const idExists = await playerRepo.findOneBy({ efootballId: dto.efootballId });
        if (idExists) {
            throw new Error("eFootball ID is already used by another player.");
        }

        // 4. Prevent duplicate efootballUsername
        const usernameExists = await playerRepo.findOneBy({ efootballUsername: dto.efootballUsername });
        if (usernameExists) {
            throw new Error("eFootball Username is already used by another player.");
        }

        logger.debug({ userId: user.id }, "Creating player profile");
        // 5. Create player profile
        const player = playerRepo.create({
            user: user,
            userId: user.id,
            efootballId: dto.efootballId,
            efootballUsername: dto.efootballUsername,
            efootballTeamName: dto.efootballTeamName,
            avatarUrl: dto.avatarUrl,
        });
        await playerRepo.save(player);

        // 6. Mark user's profile as complete
        user.hasCompleteProfile = true;
        await userRepo.save(user);

        return player;
    }

    async getPlayerProfile(user: User): Promise<PlayerProfileDto> {
        const playerRepo = AppDataSource.getRepository(Player);

        // Get player profile with user relation
        const player = await playerRepo.findOne({
            where: { userId: user.id },
            relations: { user: true }
        });

        if (!player) {
            throw new Error("Player profile not found. Please create your player profile first.");
        }

        // Verify user is a player
        if (!user.role || user.role.name !== "player") {
            throw new Error("Only players can access player profile.");
        }

        return {
            playerId: player.id,
            efootballId: player.efootballId,
            efootballUsername: player.efootballUsername,
            efootballTeamName: player.efootballTeamName
        };
    }
}
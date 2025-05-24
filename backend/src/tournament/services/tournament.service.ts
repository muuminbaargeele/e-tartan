import AppDataSource from "../../data-source";
import { Tournament } from "../entities/tournament.entity";
import { CreateTournamentDto } from "../dtoes/createTournament.dto";
import { User } from "../../user/entities/user.entity";
import { UpdateTournamentDto } from "../dtoes/updateTournament.dto";
import { TournamentType } from "../entities/tournamentType.entity";
import { TournamentStatus } from "../entities/tournamentStatus.entity";
export class TournamentService {
    private tournamentRepo = AppDataSource.getRepository(Tournament);

    private tournamentTypeRepo = AppDataSource.getRepository(TournamentType);
    private tournamentStatusRepo = AppDataSource.getRepository(TournamentStatus);

    async createTournament(dto: CreateTournamentDto, user: User): Promise<Tournament> {
        if (!user.role || user.role.name !== "admin") {
            throw new Error("Only admin users can create tournaments.");
        }

        const startDate = new Date(dto.startDate);

        // Make sure you use the correct type/status from the database
        const type = await this.tournamentTypeRepo.findOneBy({ id: dto.typeId });
        const status = await this.tournamentStatusRepo.findOneBy({ id: dto.statusId });

        if (!type) throw new Error("Invalid tournament type.");
        if (!status) throw new Error("Invalid tournament status.");

        // End date calculation logic
        let endDate: Date;
        if (dto.endDate) {
            endDate = new Date(dto.endDate);
        } else if (type.id === 1) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 5);
        } else if (type.id === 2) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 30);
        } else {
            endDate = new Date(startDate);
        }

        // Unique tournament name logic
        const baseName = dto.name.trim();
        const existingTournaments = await this.tournamentRepo
            .createQueryBuilder("tournament")
            .where("tournament.name = :name OR tournament.name LIKE :namePattern", {
                name: baseName,
                namePattern: `${baseName} #%`
            })
            .getMany();

        let finalName = baseName;
        if (existingTournaments.length > 0) {
            const numbers = existingTournaments
                .map(t => {
                    const match = t.name.match(/#(\d+)$/);
                    return match ? parseInt(match[1]) : 1;
                });
            const nextNumber = Math.max(...numbers) + 1;
            finalName = `${baseName} #${nextNumber}`;
        }

        let tournament = this.tournamentRepo.create({
            name: finalName,
            type: type,
            status: status,
            startDate,
            endDate,
            maxPlayers: dto.maxPlayers,
            isAuto: dto.isAuto,
            createdBy: user,
        });
        tournament = await this.tournamentRepo.save(tournament);
        return tournament;
    }

    async updateEndDateFromSchedule(tournamentId: number, lastMatchDate: Date): Promise<void> {
        await this.tournamentRepo.update(
            { id: tournamentId },
            { endDate: lastMatchDate }
        );
    }

    async getTournamentById(id: number): Promise<Tournament | null> {
        return await this.tournamentRepo.findOne({ where: { id } });
    }

    async getAllTournamentsWithTypesStatuses() {
        const tournaments = await this.tournamentRepo.find({ order: { startDate: "DESC" }, relations: {type: true, status: true} });
        const types = await this.tournamentTypeRepo.find();
        const statuses = await this.tournamentStatusRepo.find();
        return { tournaments, types, statuses };
    }

    async updateTournament(id: number, dto: UpdateTournamentDto): Promise<Tournament | null> {
        let tournament = await this.tournamentRepo.findOne({ where: { id } });
        if (!tournament) return null;

        Object.assign(tournament, dto);
        tournament = await this.tournamentRepo.save(tournament);
        return tournament;
    }

    async deleteTournament(id: number): Promise<boolean> {
        const result = await this.tournamentRepo.delete(id);
        return result.affected > 0;
    }

}
import AppDataSource from "../../data-source";
import { Tournament } from "../entities/tournament.entity";
import { CreateTournamentDto } from "../dtoes/createTournament.dto";
import { User } from "../../user/entities/user.entity";
import { UpdateTournamentDto } from "../dtoes/updateTournament.dto";
import { TournamentType } from "../entities/tournamentType.entity";
import { TournamentStatus } from "../entities/tournamentStatus.entity";
import { TournamentParticipant } from "../entities/tournamentParticipant.entity";
import { SubscriptionType } from "../../subscription/entities/subscriptionType.entity";
import { PromoCode } from "../../promo/entities/promoCode.entity";
import {
    findTournamentOrThrow,
    validateSubscriptionType,
    assertRegistrationOpen,
    assertNotAlreadyRegistered,
    assertNotFull,
    validatePromoCode,
    calculateDiscount,
    incrementPromoUsage,
    calculateFinalPrice
} from "../../utils/helpers";
export class TournamentService {

    private tournamentRepo = AppDataSource.getRepository(Tournament);
    private tournamentTypeRepo = AppDataSource.getRepository(TournamentType);
    private tournamentStatusRepo = AppDataSource.getRepository(TournamentStatus);
    private tournamentParticipantRepo = AppDataSource.getRepository(TournamentParticipant);
    private tournamentSubscriptionTypeRepo = AppDataSource.getRepository(SubscriptionType);

    async createTournament(dto: CreateTournamentDto, user: User): Promise<Tournament> {
        if (!user.role || user.role.name !== "admin") {
            throw new Error("Only admin users can create tournaments.");
        }

        const startDate = new Date(dto.startDate);

        // Make sure you use the correct type/status from the database
        const type = await this.tournamentTypeRepo.findOneBy({ id: dto.typeId });
        const status = await this.tournamentStatusRepo.findOneBy({ id: dto.statusId });
        const subscriptionType = await this.tournamentSubscriptionTypeRepo.findOneBy({ id: dto.subscriptionTypeId });

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
            subscriptionType: subscriptionType
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
        const tournaments = await this.tournamentRepo.find({ order: { startDate: "DESC" }, relations: { type: true, status: true, subscriptionType: true } });
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


    async registerPlayerForTournament(
        tournamentId: number,
        playerId: number,
        subscriptionTypeId?: number,
        promoCode?: string
    ) {
        // 1. Validate Tournament
        const tournament = await findTournamentOrThrow(this.tournamentRepo, tournamentId);

        // 2. Validate Subscription Type
        validateSubscriptionType(tournament, subscriptionTypeId);

        // 3. Registration Status
        assertRegistrationOpen(tournament);

        // 4. Prevent duplicate registration
        await assertNotAlreadyRegistered(this.tournamentParticipantRepo, tournamentId, playerId);

        // 5. Capacity check
        await assertNotFull(this.tournamentParticipantRepo, tournament);

        // 6. Promo code and pricing
        let discount = 0;
        let appliedPromo: PromoCode | undefined = undefined;
        if (promoCode) {
            appliedPromo = await validatePromoCode(promoCode, tournamentId);
            discount = calculateDiscount(tournament.price, appliedPromo);
            await incrementPromoUsage(appliedPromo);
        }
        const finalPrice = calculateFinalPrice(tournament.price, discount);

        // 7. Register participant
        const participant = this.tournamentParticipantRepo.create({
            tournamentId,
            playerId,
            subscriptionTypeId: subscriptionTypeId ?? null,
            paid: false,
            isEliminated: false,
            groupNumber: null,
            promoCodeId: appliedPromo?.id ?? null,
            originalPrice: tournament.price,
            discountApplied: discount,
            finalPrice: finalPrice,
        });
        await this.tournamentParticipantRepo.save(participant);

        // After saving the participant, check if tournament is now full
        const participantsCount = await this.tournamentParticipantRepo.countBy({ tournamentId });
        if (participantsCount >= tournament.maxPlayers) {
            // Change status to REGISTRATION_CLOSED if max capacity reached
            const registrationClosedStatus = await this.tournamentStatusRepo.findOneBy({ name: "REGISTRATION_CLOSED" });
            if (registrationClosedStatus) {
                tournament.status = registrationClosedStatus;
                tournament.statusId = registrationClosedStatus.id;
                await this.tournamentRepo.save(tournament);
            }
        }

        return {
            success: true,
            message: "Registration successful",
            originalPrice: tournament.price,
            discount: discount,
            finalPrice: finalPrice,
            promoCode: appliedPromo ? appliedPromo.code : null
        };
    };

    async getParticipantsForTournament(tournamentId: number) {
        const participants = await this.tournamentParticipantRepo.find({
            where: { tournamentId },
            relations: {
                player: true,
                subscriptionType: true,
                promoCode: true
            },
            order: { joinedAt: "ASC" }
        });
        return participants;
    };

    async getPublicParticipantsForTournament(tournamentId: number) {
        const participants = await this.tournamentParticipantRepo.find({
            where: { tournamentId },
            relations: { player: true },
            order: { joinedAt: "ASC" }
        });
        return participants.map(p => ({
            id: p.id,
            joinedAt: p.joinedAt,
            efootballUsername: p.player?.efootballUsername,
            avatarUrl: p.player?.avatarUrl,
            // Add other public fields as needed
        }));
    }

    async isPlayerRegisteredForTournament(tournamentId: number, playerId: number): Promise<boolean> {
        const participant = await this.tournamentParticipantRepo.findOneBy({ tournamentId, playerId });
        return !!participant;
    }

}
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
import { Match } from "../../match/entities/match.entity";
import { MatchStatus } from "../../match/entities/matchStatus.entity";
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

    async startTournament(tournamentId: number): Promise<Tournament> {
        // Use transaction for safety
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            const tournamentRepo = transactionalEntityManager.getRepository(Tournament);
            const tournamentStatusRepo = transactionalEntityManager.getRepository(TournamentStatus);
            const tournamentParticipantRepo = transactionalEntityManager.getRepository(TournamentParticipant);
            const matchRepo = transactionalEntityManager.getRepository(Match);
            const matchStatusRepo = transactionalEntityManager.getRepository(MatchStatus);

            // 1. Fetch tournament with status relation
            const tournament = await tournamentRepo.findOne({
                where: { id: tournamentId },
                relations: { status: true }
            });

            if (!tournament) {
                throw new Error("Tournament not found");
            }

            // 2. Validate tournament status is "OPEN" or "REGISTRATION_CLOSED"
            const allowedStatuses = ["OPEN", "REGISTRATION_CLOSED"];
            if (!tournament.status || !allowedStatuses.includes(tournament.status.name)) {
                throw new Error(`Tournament cannot be started. Current status: ${tournament.status?.name || "unknown"}`);
            }

            // 3. Check if tournament already has round 1 matches (idempotency)
            const existingMatches = await matchRepo.find({
                where: {
                    tournamentId,
                    round: 1
                }
            });

            if (existingMatches.length > 0) {
                // Tournament already started, return it
                return await tournamentRepo.findOne({
                    where: { id: tournamentId },
                    relations: { status: true, type: true }
                }) as Tournament;
            }

            // 4. Validate at least 2 participants
            const participantCount = await tournamentParticipantRepo.count({
                where: { tournamentId, isEliminated: false }
            });

            if (participantCount < 2) {
                throw new Error("Tournament must have at least 2 participants to start");
            }

            // 5. Set tournament status to "ONGOING"
            const ongoingStatus = await tournamentStatusRepo.findOneBy({ name: "ONGOING" });
            if (!ongoingStatus) {
                throw new Error("Tournament status 'ONGOING' not found");
            }

            tournament.statusId = ongoingStatus.id;
            tournament.status = ongoingStatus;
            await tournamentRepo.save(tournament);

            // 6. Fetch all participants
            const participants = await tournamentParticipantRepo.find({
                where: { tournamentId, isEliminated: false },
                relations: { player: true }
            });

            // 7. Shuffle participants randomly
            function shuffle<T>(array: T[]): T[] {
                let currentIndex = array.length, randomIndex;
                while (currentIndex !== 0) {
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex--;
                    [array[currentIndex], array[randomIndex]] = [
                        array[randomIndex], array[currentIndex]
                    ];
                }
                return array;
            }
            const shuffled = shuffle([...participants]);

            // 8. Get match statuses
            const scheduledStatus = await matchStatusRepo.findOneBy({ name: "scheduled" });
            const byeStatus = await matchStatusRepo.findOneBy({ name: "bye" });
            if (!scheduledStatus || !byeStatus) {
                throw new Error("Match statuses not seeded");
            }

            // 9. Generate round 1 matches
            const matches: Match[] = [];
            const scheduledAt = tournament.startDate;

            for (let i = 0; i < shuffled.length; i += 2) {
                const p1 = shuffled[i];
                const p2 = shuffled[i + 1];

                if (!p2) {
                    // Odd number of participants - give bye to last player
                    matches.push(matchRepo.create({
                        tournamentId,
                        round: 1,
                        player1Id: p1.playerId,
                        player2Id: null,
                        scheduledAt,
                        statusId: byeStatus.id,
                        winnerId: p1.playerId, // Bye means player1 wins automatically
                        playedAt: new Date() // Bye is considered played immediately
                    }));
                } else {
                    matches.push(matchRepo.create({
                        tournamentId,
                        round: 1,
                        player1Id: p1.playerId,
                        player2Id: p2.playerId,
                        scheduledAt,
                        statusId: scheduledStatus.id
                    }));
                }
            }

            // 10. Save all matches
            await matchRepo.save(matches);

            // 11. Reload tournament with relations
            const updatedTournament = await tournamentRepo.findOne({
                where: { id: tournamentId },
                relations: { status: true, type: true }
            });

            if (!updatedTournament) {
                throw new Error("Failed to reload tournament after start");
            }

            return updatedTournament;
        });
    }

}
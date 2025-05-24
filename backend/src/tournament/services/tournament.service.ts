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
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: { status: true }
        });
        if (!tournament) throw new Error("Tournament not found");

        if (tournament.subscriptionTypeId && !subscriptionTypeId) {
            throw new Error("This tournament requires a subscription type.");
        }

        if (tournament.subscriptionTypeId && subscriptionTypeId !== tournament.subscriptionTypeId) {
            throw new Error("Incorrect subscription type for this tournament.");
        }

        // 2. Only allow registration if status is open/upcoming
        // Adjust IDs as needed for your statuses
        const allowedStatusIds = [1]; // e.g., open and upcoming
        if (!allowedStatusIds.includes(tournament.statusId)) {
            throw new Error("Tournament is not open for registration");
        }

        // 3. Prevent duplicate registration
        const existing = await this.tournamentParticipantRepo.findOneBy({ tournamentId, playerId });
        if (existing) throw new Error("Player already registered for this tournament");

        // 4. Capacity check
        const count = await this.tournamentParticipantRepo.countBy({ tournamentId });
        if (count >= tournament.maxPlayers) throw new Error("Tournament is already full");
        console.log("player", playerId); // see what properties exist
        // 5. Register participant
        let discount = 0;
        let appliedPromo: PromoCode | undefined = undefined;

        // Only process promo code if provided
        if (promoCode) {
            const promoRepo = AppDataSource.getRepository(PromoCode);

            // Find promo: global or specific to this tournament
            const promo = await promoRepo.findOne({
                where: [
                    { code: promoCode, isActive: true, tournamentId: null },
                    { code: promoCode, isActive: true, tournamentId: tournamentId }
                ],
                relations: { discountType: true },
            });

            if (!promo) {
                throw new Error("Invalid or inactive promo code.");
            }
            // Check date validity
            const now = new Date();
            if (promo.validFrom && promo.validFrom > now) throw new Error("Promo code not yet active.");
            if (promo.validTo && promo.validTo < now) throw new Error("Promo code expired.");

            // Usage limit
            if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
                throw new Error("Promo code usage limit reached.");
            }

            // Must match tournament if tournament-specific
            if (promo.tournamentId && promo.tournamentId !== tournamentId) {
                throw new Error("Promo code not valid for this tournament.");
            }

            // Calculate discount
            if (promo.discountType.name === "amount") {
                discount = Number(promo.value);
            } else if (promo.discountType.name === "percentage") {
                discount = Number(tournament.price) * Number(promo.value) / 100;
            }

            appliedPromo = promo;
        }

        // Final price never less than zero
        const finalPrice = Math.max(0, Number(tournament.price) - discount);

        // Optionally, increment promo code usage count (for tracking/limits)
        if (appliedPromo) {
            appliedPromo.usedCount = (appliedPromo.usedCount ?? 0) + 1;
            await AppDataSource.getRepository(PromoCode).save(appliedPromo);
        }

        // ...then when creating the participant, store discount info
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
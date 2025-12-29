// src/utils/helpers.ts

import AppDataSource from "../data-source";
import { PromoCode } from "../promo/entities/promoCode.entity";
import { Tournament } from "../tournament/entities/tournament.entity";
import { TournamentParticipant } from "../tournament/entities/tournamentParticipant.entity";

/**
 * Find a tournament by ID, or throw an error if not found.
 */
export async function findTournamentOrThrow(tournamentRepo: any, tournamentId: number): Promise<Tournament> {
    const tournament = await tournamentRepo.findOne({
        where: { id: tournamentId },
        relations: { status: true }
    });
    if (!tournament) throw new Error("Tournament not found");
    return tournament;
}

/**
 * Validate that the subscriptionTypeId is present and correct for the tournament.
 */
export function validateSubscriptionType(tournament: Tournament, subscriptionTypeId?: number) {
    if (tournament.subscriptionTypeId && !subscriptionTypeId)
        throw new Error("This tournament requires a subscription type.");
    if (tournament.subscriptionTypeId && subscriptionTypeId !== tournament.subscriptionTypeId)
        throw new Error("Incorrect subscription type for this tournament.");
}

/**
 * Ensure the tournament is open for registration.
 * @param allowedStatusIds - Array of valid status IDs (default: [1])
 */
export function assertRegistrationOpen(tournament: Tournament, allowedStatusIds: number[] = [1]) {
    if (!allowedStatusIds.includes(tournament.statusId))
        throw new Error("Tournament is not open for registration");
}

/**
 * Throw error if the player is already registered for the tournament.
 */
export async function assertNotAlreadyRegistered(tournamentParticipantRepo: any, tournamentId: number, playerId: number) {
    const exists = await tournamentParticipantRepo.findOneBy({ tournamentId, playerId });
    if (exists) throw new Error("Player already registered for this tournament");
}

/**
 * Throw error if the tournament is already full.
 */
export async function assertNotFull(tournamentParticipantRepo: any, tournament: Tournament) {
    const count = await tournamentParticipantRepo.countBy({ tournamentId: tournament.id });
    if (count >= tournament.maxPlayers) throw new Error("Tournament is already full");
}

/**
 * Validate a promo code and return it, or throw if invalid.
 */
export async function validatePromoCode(promoCode: string, tournamentId: number): Promise<PromoCode> {
    const promoRepo = AppDataSource.getRepository(PromoCode);
    const promo = await promoRepo.findOne({
        where: [
            { code: promoCode, isActive: true, tournamentId: null },
            { code: promoCode, isActive: true, tournamentId: tournamentId }
        ],
        relations: { discountType: true },
    });

    if (!promo)
        throw new Error("Invalid or inactive promo code.");

    const now = new Date();
    if (promo.validFrom && promo.validFrom > now)
        throw new Error("Promo code not yet active.");
    if (promo.validTo && promo.validTo < now)
        throw new Error("Promo code expired.");

    if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit)
        throw new Error("Promo code usage limit reached.");

    if (promo.tournamentId && promo.tournamentId !== tournamentId)
        throw new Error("Promo code not valid for this tournament.");

    return promo;
}

/**
 * Calculate the discount based on promo code and tournament price.
 */
export function calculateDiscount(price: number, promo: PromoCode): number {
    if (promo.discountType.name === "amount") {
        return Number(promo.value);
    } else if (promo.discountType.name === "percentage") {
        return Number(price) * Number(promo.value) / 100;
    }
    return 0;
}

/**
 * Ensure the final price is never negative.
 */
export function calculateFinalPrice(price: number, discount: number): number {
    return Math.max(0, Number(price) - discount);
}

/**
 * Increment the used count for a promo code.
 */
export async function incrementPromoUsage(promo: PromoCode): Promise<void> {
    promo.usedCount = (promo.usedCount ?? 0) + 1;
    await AppDataSource.getRepository(PromoCode).save(promo);
}
import cron from "node-cron";
import AppDataSource from "../data-source";
import { Tournament } from "../tournament/entities/tournament.entity";
import { TournamentStatus } from "../tournament/entities/tournamentStatus.entity";
import { TournamentParticipant } from "../tournament/entities/tournamentParticipant.entity";
import { generateFirstRoundMatches } from "../match/services/match.service";
import { In } from "typeorm";

const tournamentRepo = AppDataSource.getRepository(Tournament);
const statusRepo = AppDataSource.getRepository(TournamentStatus);
const participantRepo = AppDataSource.getRepository(TournamentParticipant);

async function processTournamentsForPairing() {
    const now = new Date();
    const openStatus = await statusRepo.findOneBy({ name: "OPEN" });
    const registrationClosedStatus = await statusRepo.findOneBy({ name: "REGISTRATION_CLOSED" });
    const ongoingStatus = await statusRepo.findOneBy({ name: "ONGOING" });

    // Find tournaments whose endDate has passed and not yet started
    const tournaments = await tournamentRepo.find({
        where: [
            { status: openStatus, endDate: In([null, undefined, now]) }, // open but should close now
            { status: registrationClosedStatus, endDate: In([null, undefined, now]) }
        ]
    });

    for (const tournament of tournaments) {
        const participantsCount = await participantRepo.countBy({ tournamentId: tournament.id });
        if (participantsCount < 2) continue; // Don't start if less than 2

        try {
            await generateFirstRoundMatches(tournament.id, tournament.startDate);
            tournament.status = ongoingStatus;
            tournament.statusId = ongoingStatus.id;
            await tournamentRepo.save(tournament);
            console.log(`Generated matches for tournament: ${tournament.name}`);
        } catch (err) {
            console.error(`Failed to generate matches for tournament ${tournament.id}:`, err.message);
        }
    }
}

cron.schedule("*/1 * * * *", async () => {
    console.log("Running tournament pairing cron job...");
    await processTournamentsForPairing();
});
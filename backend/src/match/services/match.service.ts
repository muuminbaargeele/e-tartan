import { In } from "typeorm";
import { TournamentParticipant } from "../../tournament/entities/tournamentParticipant.entity";
import { Match } from "../../match/entities/match.entity";
import { MatchStatus } from "../../match/entities/matchStatus.entity";
import AppDataSource from "../../data-source";
import { Tournament } from "../../tournament/entities/tournament.entity";
import { TournamentStatus } from "../../tournament/entities/tournamentStatus.entity";

export async function generateFirstRoundMatches(tournamentId: number, scheduledAt: Date) {
  const participantRepo = AppDataSource.getRepository(TournamentParticipant);
  const matchRepo = AppDataSource.getRepository(Match);
  const statusRepo = AppDataSource.getRepository(MatchStatus);
  const tournamentRepo = AppDataSource.getRepository(Tournament);
  const tournamentStatusRepo = AppDataSource.getRepository(TournamentStatus);

  // 1. Fetch active participants
  const participants = await participantRepo.find({
    where: { tournamentId, isEliminated: false },
    relations: { player: true }
  });

  if (participants.length < 2) {
    const cancelledStatus = await tournamentStatusRepo.findOneBy({ name: "CANCELLED" });
    if (cancelledStatus) {
      await tournamentRepo.update({ id: tournamentId }, { statusId: cancelledStatus.id });
    }
    throw new Error("Not enough participants to start the tournament. Tournament canceled.");
  }

  // 2. Shuffle participants
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

  // 3. Get status IDs
  const scheduledStatus = await statusRepo.findOneBy({ name: "scheduled" });
  const byeStatus = await statusRepo.findOneBy({ name: "bye" });
  if (!scheduledStatus || !byeStatus) throw new Error("Match statuses not seeded.");

  // 4. Pair and create matches
  const matches: Match[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const p1 = shuffled[i];
    const p2 = shuffled[i + 1];

    if (!p2) {
      // Odd participant out: Give a bye
      matches.push(matchRepo.create({
        tournamentId,
        round: 1,
        player1Id: p1.playerId,
        player2Id: null,
        scheduledAt,
        statusId: byeStatus.id
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

  // 5. Save all matches
  await matchRepo.save(matches);

  return matches;
}
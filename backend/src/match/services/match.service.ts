import { In, DataSource } from "typeorm";
import { TournamentParticipant } from "../../tournament/entities/tournamentParticipant.entity";
import { Match } from "../../match/entities/match.entity";
import { MatchStatus } from "../../match/entities/matchStatus.entity";
import AppDataSource from "../../data-source";
import { Tournament } from "../../tournament/entities/tournament.entity";
import { TournamentStatus } from "../../tournament/entities/tournamentStatus.entity";
import { TournamentType } from "../../tournament/entities/tournamentType.entity";

export class MatchService {
  private matchRepo = AppDataSource.getRepository(Match);
  private matchStatusRepo = AppDataSource.getRepository(MatchStatus);
  private tournamentRepo = AppDataSource.getRepository(Tournament);
  private tournamentStatusRepo = AppDataSource.getRepository(TournamentStatus);
  private tournamentTypeRepo = AppDataSource.getRepository(TournamentType);
  private tournamentParticipantRepo = AppDataSource.getRepository(TournamentParticipant);

  async getMatchesByTournamentId(tournamentId: number): Promise<Match[]> {
    const matches = await this.matchRepo.find({
      where: { tournamentId },
      relations: { 
        player1: true, 
        player2: true, 
        status: true,
        tournament: true
      },
      order: { round: "ASC" }
    });
    return matches;
  }

  async getMatchById(matchId: number): Promise<Match | null> {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: { 
        player1: true, 
        player2: true, 
        status: true,
        tournament: true
      }
    });
    return match;
  }

  /**
   * Check if a player can access a specific match
   * Player can access if:
   * - They are player1 or player2 in the match
   * OR
   * - They are registered in the tournament that the match belongs to
   */
  async canPlayerAccessMatch(playerId: number, match: Match): Promise<boolean> {
    // Check if player is player1 or player2
    if (match.player1Id === playerId || match.player2Id === playerId) {
      return true;
    }

    // Check if player is registered in the tournament
    const participant = await this.tournamentParticipantRepo.findOne({
      where: {
        tournamentId: match.tournamentId,
        playerId: playerId
      }
    });

    return !!participant;
  }

  /**
   * Check if a player is registered in a tournament
   */
  async isPlayerRegisteredInTournament(playerId: number, tournamentId: number): Promise<boolean> {
    const participant = await this.tournamentParticipantRepo.findOne({
      where: {
        tournamentId,
        playerId
      }
    });

    return !!participant;
  }

  /**
   * Get public scheduled matches
   * Returns scheduled and played matches from public tournaments
   * Limited to 100 results, ordered by scheduledAt ASC
   * Includes scores for played matches
   */
  async getPublicScheduledMatches(): Promise<any[]> {
    // Use query builder for optimized query with joins
    const matches = await this.matchRepo
      .createQueryBuilder("match")
      .leftJoinAndSelect("match.tournament", "tournament")
      .leftJoinAndSelect("tournament.type", "tournamentType")
      .leftJoinAndSelect("match.status", "matchStatus")
      .leftJoinAndSelect("match.player1", "player1")
      .leftJoinAndSelect("match.player2", "player2")
      .where("(matchStatus.name = :scheduledStatus OR matchStatus.name = :playedStatus)", { 
        scheduledStatus: "scheduled",
        playedStatus: "played"
      })
      .andWhere("(tournament.isPrivate IS NULL OR tournament.isPrivate = :isPrivate)", { isPrivate: false })
      .orderBy("match.scheduledAt", "ASC")
      .limit(100)
      .getMany();

    // Format response with only required fields
    return matches.map(match => {
      const result: any = {
        matchId: match.id,
        scheduledAt: match.scheduledAt,
        status: match.status.name,
        tournament: {
          name: match.tournament.name,
          type: match.tournament.type.name
        },
        player1: {
          username: match.player1.efootballUsername
        },
        player2: match.player2 ? {
          username: match.player2.efootballUsername
        } : null
      };

      // Add scores if match is played
      if (match.status.name === "played" && match.player1Score !== null && match.player2Score !== null) {
        result.score = {
          player1: match.player1Score,
          player2: match.player2Score
        };
      }

      return result;
    });
  }

  async submitMatchResult(
    matchId: number,
    playerId: number,
    player1Score: number,
    player2Score: number
  ): Promise<Match> {
    // Use transaction for safety
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const matchRepo = transactionalEntityManager.getRepository(Match);
      const matchStatusRepo = transactionalEntityManager.getRepository(MatchStatus);
      const tournamentRepo = transactionalEntityManager.getRepository(Tournament);
      const tournamentStatusRepo = transactionalEntityManager.getRepository(TournamentStatus);
      const tournamentTypeRepo = transactionalEntityManager.getRepository(TournamentType);

      // Load match with relations
      const match = await matchRepo.findOne({
        where: { id: matchId },
        relations: { status: true, tournament: { type: true } }
      });

      if (!match) {
        throw new Error("Match not found");
      }

      // Idempotency check: If match is already "played", return it without processing
      if (match.status.name === "played") {
        return await matchRepo.findOne({
          where: { id: matchId },
          relations: { 
            player1: true, 
            player2: true, 
            status: true,
            tournament: { type: true }
          }
        }) as Match;
      }

      // Check if match status is "scheduled"
      if (match.status.name !== "scheduled") {
        throw new Error("Match is not in scheduled status");
      }

      // Check if authenticated player is player1 or player2
      if (match.player1Id !== playerId && match.player2Id !== playerId) {
        throw new Error("You are not authorized to submit results for this match");
      }

      // Get "played" status
      const playedStatus = await matchStatusRepo.findOneBy({ name: "played" });
      if (!playedStatus) {
        throw new Error("Match status 'played' not found");
      }

      // Determine winner
      let winnerId: number | null = null;
      if (player1Score > player2Score) {
        winnerId = match.player1Id;
      } else if (player2Score > player1Score) {
        winnerId = match.player2Id;
      }
      // If equal, winnerId remains null (draw allowed for MVP)

      // Update match with scores, winner, and status
      match.player1Score = player1Score;
      match.player2Score = player2Score;
      match.winnerId = winnerId;
      match.statusId = playedStatus.id;
      match.playedAt = new Date();

      await matchRepo.save(match);

      // Check if round is complete and handle tournament progression
      await this.checkRoundCompletionAndProgress(
        match.tournamentId,
        match.round,
        matchRepo,
        tournamentRepo,
        tournamentStatusRepo,
        tournamentTypeRepo,
        matchStatusRepo,
        transactionalEntityManager
      );

      // Reload match with all relations
      const updatedMatch = await matchRepo.findOne({
        where: { id: matchId },
        relations: { 
          player1: true, 
          player2: true, 
          winner: true,
          status: true,
          tournament: { type: true }
        }
      });

      if (!updatedMatch) {
        throw new Error("Failed to reload match after update");
      }

      return updatedMatch;
    });
  }

  private async checkRoundCompletionAndProgress(
    tournamentId: number,
    currentRound: number,
    matchRepo: any,
    tournamentRepo: any,
    tournamentStatusRepo: any,
    tournamentTypeRepo: any,
    matchStatusRepo: any,
    transactionalEntityManager: any
  ): Promise<void> {
    // Fetch all matches for the same tournament and round
    const roundMatches = await matchRepo.find({
      where: { 
        tournamentId,
        round: currentRound
      },
      relations: { status: true }
    });

    // Check if ALL matches in the round have status = "played" or "bye"
    // Both statuses indicate the match is finished
    const allMatchesFinished = roundMatches.every(
      (m: Match) => m.status.name === "played" || m.status.name === "bye"
    );

    if (!allMatchesFinished) {
      // Round not complete, stop processing
      return;
    }

    // Round is complete - collect winners
    // For "bye" matches, winnerId is already set
    // For "played" matches, winnerId should be set (draws have null winnerId and are ignored)
    const winners: number[] = [];
    for (const m of roundMatches) {
      if (m.winnerId !== null && m.winnerId !== undefined) {
        winners.push(m.winnerId);
      }
    }

    // Load tournament with type
    const tournament = await tournamentRepo.findOne({
      where: { id: tournamentId },
      relations: { type: true }
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if tournament is knockout type
    const isKnockout = tournament.type.name.toLowerCase() === "knockout";

    if (!isKnockout) {
      // Only handle knockout tournaments for MVP
      return;
    }

    // If only one winner remains, tournament is finished
    if (winners.length === 1) {
      const completedStatus = await tournamentStatusRepo.findOneBy({ name: "COMPLETED" });
      if (!completedStatus) {
        throw new Error("Tournament status 'COMPLETED' not found");
      }

      await tournamentRepo.update(
        { id: tournamentId },
        { 
          statusId: completedStatus.id,
          winnerId: winners[0]
        }
      );
      return;
    }

    // If more than one winner, generate next round
    if (winners.length > 1) {
      await this.generateNextRoundMatches(
        tournamentId,
        currentRound + 1,
        winners,
        matchRepo,
        tournamentRepo,
        tournamentStatusRepo,
        matchStatusRepo
      );
    }
  }

  private async generateNextRoundMatches(
    tournamentId: number,
    nextRound: number,
    winnerIds: number[],
    matchRepo: any,
    tournamentRepo: any,
    tournamentStatusRepo: any,
    matchStatusRepo: any
  ): Promise<void> {
    // Check if next round matches already exist (idempotency)
    const existingMatches = await matchRepo.find({
      where: {
        tournamentId,
        round: nextRound
      }
    });

    if (existingMatches.length > 0) {
      // Next round already exists, don't create duplicates
      return;
    }

    // Get statuses
    const scheduledStatus = await matchStatusRepo.findOneBy({ name: "scheduled" });
    const byeStatus = await matchStatusRepo.findOneBy({ name: "bye" });
    const playedStatus = await matchStatusRepo.findOneBy({ name: "played" });
    
    if (!scheduledStatus || !byeStatus || !playedStatus) {
      throw new Error("Required match statuses not found");
    }

    // Get tournament to get scheduledAt time (use transactional repo)
    const tournament = await tournamentRepo.findOne({
      where: { id: tournamentId }
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Use tournament startDate as scheduledAt for next round
    const scheduledAt = tournament.startDate;

    // Pair winners in order (no shuffle for MVP)
    const matches: Match[] = [];
    for (let i = 0; i < winnerIds.length; i += 2) {
      const player1Id = winnerIds[i];
      const player2Id = winnerIds[i + 1];

      if (!player2Id) {
        // Odd number of winners - give bye to last player
        matches.push(matchRepo.create({
          tournamentId,
          round: nextRound,
          player1Id: player1Id,
          player2Id: null,
          scheduledAt,
          statusId: byeStatus.id,
          winnerId: player1Id, // Bye means player1 wins automatically
          playedAt: new Date() // Bye is considered played immediately
        }));
      } else {
        matches.push(matchRepo.create({
          tournamentId,
          round: nextRound,
          player1Id: player1Id,
          player2Id: player2Id,
          scheduledAt,
          statusId: scheduledStatus.id
        }));
      }
    }

    // Save all matches
    await matchRepo.save(matches);

    // If there was a bye match and it's the only match, tournament is complete
    // This handles the case where a bye creates a single-player round
    if (matches.length === 1 && matches[0].statusId === byeStatus.id && matches[0].winnerId) {
      // This round only has a bye, so the tournament should be completed
      const completedStatus = await tournamentStatusRepo.findOneBy({ name: "COMPLETED" });
      if (completedStatus) {
        await tournamentRepo.update(
          { id: tournamentId },
          { 
            statusId: completedStatus.id,
            winnerId: matches[0].winnerId
          }
        );
      }
    }
  }
}

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
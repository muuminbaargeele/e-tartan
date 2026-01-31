import { Router, Request, Response } from "express";
import { playerOrAdminAuthMiddleware } from "../../auth/middleware/playerOrAdminAuth.middleware";
import { playerAuthMiddleware } from "../../auth/middleware/playerAuth.middleware";
import { MatchService } from "../services/match.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";

const router = Router();
const matchService = new MatchService();

// GET /match/public/scheduled
// Auth: NONE (public)
// Purpose: Public schedule page (all upcoming matches)
router.get(
  "/public/scheduled",
  async (req: Request, res: Response) => {
    try {
      const matches = await matchService.getPublicScheduledMatches();
      res.status(HttpStatus.OK).json(success(matches));
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

// GET /match/tournament/:tournamentId
// Auth: Player OR Admin
// Fetch all matches for the given tournament, ordered by round ASC
router.get(
  "/tournament/:tournamentId",
  playerOrAdminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const tournamentId = Number(req.params.tournamentId);
      if (isNaN(tournamentId)) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Invalid tournament ID", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      const user = (req as any).user;
      const isAdmin = user.role && user.role.name === "admin";

      // Admin can access all matches
      if (isAdmin) {
        const matches = await matchService.getMatchesByTournamentId(tournamentId);
        res.status(HttpStatus.OK).json(success(matches));
        return;
      }

      // Player must be registered in the tournament
      const playerId = user.player?.id;
      if (!playerId) {
        res.status(HttpStatus.FORBIDDEN).json(
          error("Access denied", HttpStatus.FORBIDDEN)
        );
        return;
      }

      const isRegistered = await matchService.isPlayerRegisteredInTournament(playerId, tournamentId);
      if (!isRegistered) {
        res.status(HttpStatus.FORBIDDEN).json(
          error("Access denied. You are not registered in this tournament.", HttpStatus.FORBIDDEN)
        );
        return;
      }

      const matches = await matchService.getMatchesByTournamentId(tournamentId);
      res.status(HttpStatus.OK).json(success(matches));
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

// GET /match/:matchId
// Auth: Player OR Admin
// Fetch match by ID
router.get(
  "/:matchId",
  playerOrAdminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const matchId = Number(req.params.matchId);
      if (isNaN(matchId)) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Invalid match ID", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      const match = await matchService.getMatchById(matchId);
      if (!match) {
        res.status(HttpStatus.NOT_FOUND).json(
          error("Match not found", HttpStatus.NOT_FOUND)
        );
        return;
      }

      const user = (req as any).user;
      const isAdmin = user.role && user.role.name === "admin";

      // Admin can access all matches
      if (isAdmin) {
        res.status(HttpStatus.OK).json(success(match));
        return;
      }

      // Player must be player1, player2, or registered in the tournament
      const playerId = user.player?.id;
      if (!playerId) {
        res.status(HttpStatus.FORBIDDEN).json(
          error("Access denied", HttpStatus.FORBIDDEN)
        );
        return;
      }

      const canAccess = await matchService.canPlayerAccessMatch(playerId, match);
      if (!canAccess) {
        res.status(HttpStatus.FORBIDDEN).json(
          error("Access denied. You are not authorized to view this match.", HttpStatus.FORBIDDEN)
        );
        return;
      }

      res.status(HttpStatus.OK).json(success(match));
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

// POST /match/:matchId/submit-result
// Auth: Player ONLY
// Submit match result
router.post(
  "/:matchId/submit-result",
  playerAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const matchId = Number(req.params.matchId);
      if (isNaN(matchId)) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Invalid match ID", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      const { player1Score, player2Score } = req.body;

      // Validate request body
      if (typeof player1Score !== "number" || typeof player2Score !== "number") {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("player1Score and player2Score must be numbers", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      // Get authenticated player
      const user = (req as any).user;
      const playerId = user.player?.id;
      if (!playerId) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("No player ID found on user", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      // Submit result through service
      const updatedMatch = await matchService.submitMatchResult(
        matchId,
        playerId,
        player1Score,
        player2Score
      );

      res.status(HttpStatus.OK).json(success(updatedMatch));
    } catch (err: any) {
      const statusCode = err.message?.includes("not found") 
        ? HttpStatus.NOT_FOUND 
        : err.message?.includes("not authorized") || err.message?.includes("not in scheduled")
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(
        error(err.message || "Server error", statusCode)
      );
    }
  }
);

export default router;


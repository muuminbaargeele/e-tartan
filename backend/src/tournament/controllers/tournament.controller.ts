import { Router, Request, Response } from "express";
import { adminAuthMiddleware } from "../../auth/middleware/adminAuth.middleware";
import { validateDto } from "../../utils/validateDto";
import { CreateTournamentDto } from "../dtoes/createTournament.dto";
import { TournamentService } from "../services/tournament.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { UpdateTournamentDto } from "../dtoes/updateTournament.dto";
import { playerAuthMiddleware } from "../../auth/middleware/playerAuth.middleware";

const router = Router();
const tournamentService = new TournamentService();

router.post(
  "/create",
  adminAuthMiddleware as any,
  validateDto(CreateTournamentDto),
  async (req: Request, res: Response) => {
    try {
      const adminUser = (req as any).user;
      const dto: CreateTournamentDto = (req as any).validatedBody;
      const tournament = await tournamentService.createTournament(dto, adminUser);
      res.status(HttpStatus.OK).json(success({ message: `${tournament.name} Created successfully.` }));
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

router.get(
  "/",
  async (req: Request, res: Response) => {
    try {
      const result = await tournamentService.getAllTournamentsWithTypesStatuses();
      res.status(HttpStatus.OK).json(success(result));
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error('Server error', HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(HttpStatus.BAD_REQUEST).json(error('Invalid tournament ID', HttpStatus.BAD_REQUEST));
        return;
      }
      const tournament = await tournamentService.getTournamentById(id);
      if (!tournament) {
        res.status(HttpStatus.NOT_FOUND).json(error('Tournament not found', HttpStatus.NOT_FOUND));
        return;
      }
      res.status(HttpStatus.OK).json(success(
        tournament));
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error('Server error', HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

router.put(
  "/:id",
  adminAuthMiddleware as any,
  validateDto(UpdateTournamentDto),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(HttpStatus.BAD_REQUEST).json(error("Invalid tournament ID", HttpStatus.BAD_REQUEST));
        return;
      }
      const dto: UpdateTournamentDto = (req as any).validatedBody;
      const updated = await tournamentService.updateTournament(id, dto);
      if (!updated) {
        res.status(HttpStatus.NOT_FOUND).json(error("Tournament not found", HttpStatus.NOT_FOUND));
        return;
      }
      res.status(HttpStatus.OK).json(success(updated));
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

router.delete(
  "/:id",
  adminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(HttpStatus.BAD_REQUEST).json(error("Invalid tournament ID", HttpStatus.BAD_REQUEST));
        return;
      }
      const ok = await tournamentService.deleteTournament(id);
      if (!ok) {
        res.status(HttpStatus.NOT_FOUND).json(error("Tournament not found", HttpStatus.NOT_FOUND));
        return;
      }
      res.status(HttpStatus.OK).json(success({ message: "Tournament deleted." }));
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

router.post(
  "/:id/register",
  playerAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const tournamentId = Number(req.params.id);
      if (isNaN(tournamentId)) {
        res.status(HttpStatus.BAD_REQUEST).json(error("Invalid tournament ID", HttpStatus.BAD_REQUEST));
        return;
      }
      const player = (req as any).user; // Make sure your auth attaches the player info here
      const { subscriptionTypeId, promoCode } = req.body || {};

      const playerId = player.player?.id;
      if (!playerId) {
        res.status(HttpStatus.BAD_REQUEST).json(error("No player ID found on user", HttpStatus.BAD_REQUEST));
        return;
      }
      const result = await tournamentService.registerPlayerForTournament(
        tournamentId,
        playerId, // or player.id, depending on your user structure
        subscriptionTypeId,
        promoCode
      );
      res.status(HttpStatus.OK).json(success(result));
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

router.get(
  "/:id/participants",
  playerAuthMiddleware as any, 
  async (req: Request, res: Response) => {
    try {
      const tournamentId = Number(req.params.id);
      if (isNaN(tournamentId)) {
        res.status(HttpStatus.BAD_REQUEST).json(error("Invalid tournament ID", HttpStatus.BAD_REQUEST));
        return;
      }
      const user = (req as any).user;
      if (user.role && user.role.name === "admin") {
        const participants = await tournamentService.getParticipantsForTournament(tournamentId);
        res.status(HttpStatus.OK).json(success(participants));
      } else {
        const participants = await tournamentService.getPublicParticipantsForTournament(tournamentId);
        res.status(HttpStatus.OK).json(success(participants));
      }
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

router.get(
  "/:id/is-registered",
  playerAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const tournamentId = Number(req.params.id);
      if (isNaN(tournamentId)) {
        res.status(HttpStatus.BAD_REQUEST).json(error("Invalid tournament ID", HttpStatus.BAD_REQUEST));
        return;
      }
      const player = (req as any).user;
      const playerId = player.player?.id;
      if (!playerId) {
        res.status(HttpStatus.BAD_REQUEST).json(error("No player ID found on user", HttpStatus.BAD_REQUEST));
        return;
      }
      const joined = await tournamentService.isPlayerRegisteredForTournament(tournamentId, playerId);
      res.status(HttpStatus.OK).json(success({ joined }));
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

export default router;
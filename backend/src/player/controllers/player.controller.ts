import { Router, Request, Response } from "express";
import { PlayerService } from "../services/player.service";
import { success, error } from "../../utils/apiResponse";
import { CreatePlayerProfileDto } from "../dtoes/createPlayerProfile.dto";
import { playerAuthMiddleware } from "../../auth/middleware/playerAuth.middleware";
import { validateDto } from "../../utils/validateDto";
import { HttpStatus } from "../../utils/enums";
import logger from "../../utils/logger";

const router = Router();
const playerService = new PlayerService();

// Create player profile (for players only)
router.post(
  "/create-profile",
  playerAuthMiddleware as any,
  validateDto(CreatePlayerProfileDto),
  async (req: Request, res: Response) => {
    try {
      const dto: CreatePlayerProfileDto = (req as any).validatedBody;
      const user = (req as any).user;
      const playerProfile = await playerService.createPlayerProfile(user, dto);

      logger.info({ userId: user.id, playerId: playerProfile.id, efootballId: dto.efootballId }, "Player profile created successfully");
      res.status(HttpStatus.OK).json(success({ 
        message: `${playerProfile.user.firstName}'s Profile Created successfully.`,
        playerId: playerProfile.id
      }));
    } catch (err: any) {
      const user = (req as any).user;
      const dto: CreatePlayerProfileDto = (req as any).validatedBody || {};
      logger.error({ err, userId: user?.id, efootballId: dto?.efootballId }, "Create player profile error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

// Get player profile (optional - redundant since user profile includes it, but useful for dedicated player endpoints)
router.get(
  "/profile",
  playerAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const playerProfile = await playerService.getPlayerProfile(user);

      logger.info({ userId: user.id, playerId: playerProfile.playerId }, "Player profile retrieved");
      res.status(HttpStatus.OK).json(success(playerProfile));
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Get player profile error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

export default router;
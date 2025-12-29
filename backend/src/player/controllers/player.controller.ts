import { Router, Request, Response } from "express";
import { PlayerService } from "../services/player.service";
import { success, error } from "../../utils/apiResponse";
import { CreatePlayerProfileDto } from "../dtoes/createPlayerProfile.dto";
import { playerAuthMiddleware } from "../../auth/middleware/playerAuth.middleware";// Adjust if needed
import { HttpStatus } from "../../utils/enums";

const router = Router();
const playerService = new PlayerService();

router.post(
  "/create-profile",
  playerAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const dto: CreatePlayerProfileDto = req.body;
      const user = (req as any).user as any;
      const playerProfile = await playerService.createPlayerProfile(user, dto);

      res.status(HttpStatus.OK).json(success({ message: `${playerProfile.user.firstName}'s Profile Created successfully.` }));
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

export default router;
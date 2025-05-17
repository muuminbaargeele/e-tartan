import { Router, Request, Response } from "express";
import { authMiddleware } from "../../auth/middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { UserProfileDto } from "../dtoes/userProfile.dto";

const router = Router();
const userService = new UserService();

router.get("/profile", authMiddleware as any, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user; 
        if (!user) {
            res.status(HttpStatus.UNAUTHORIZED).json(
                error("Unauthorized", HttpStatus.UNAUTHORIZED)
            );
            return;
        }

        const profile: UserProfileDto = await userService.getProfile(user);

        res.status(HttpStatus.OK).json(success(profile));
        return;
    } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
            error("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        );
        return;
    }
});

export default router;
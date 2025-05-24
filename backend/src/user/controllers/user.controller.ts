import { Router, Request, Response } from "express";
import { authMiddleware } from "../../auth/middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { UserProfileDto } from "../dtoes/userProfile.dto";
import { CreateUserDto } from "../dtoes/createUser.dto";
import { validateDto } from "../../utils/validateDto";
import { SysConfig } from "../../utils/entities/sysconfig.entity";
import AppDataSource from "../../data-source";

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

router.post(
  "/create",
  validateDto(CreateUserDto),
  async (req: Request, res: Response) => {
    try {
      const dto: CreateUserDto = (req as any).validatedBody;
      const { user, otpType } = await userService.createUser(dto);

      const sysConfigRepo = AppDataSource.getRepository(SysConfig);
      const smsOtp = await sysConfigRepo.findOneBy({ key: "isSmsOtpActive" });
      const emailOtp = await sysConfigRepo.findOneBy({ key: "isEmailOtpActive" });

      res.status(HttpStatus.OK).json(
        success({ userId: user.id, username: user.username, otpType })
      );
      return;
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(
        error(err.message, HttpStatus.BAD_REQUEST)
      );
      return;
    }
  }
);

router.delete(
  "/delete",
  authMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      await userService.deleteAccount(user);
      res.status(HttpStatus.OK).json(success({ message: "Account deleted successfully." }));
      return;
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
      return;
    }
  }
);

export default router;
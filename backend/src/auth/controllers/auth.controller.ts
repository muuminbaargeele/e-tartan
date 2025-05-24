import { Router, Request, Response } from "express";
import { validateDto } from "../../utils/validateDto";
import { LoginDto } from "../dtoes/login.dto";
import { ForgotPasswordDto } from "../dtoes/forgotPassword.dto";
import { User } from "../../user/entities/user.entity";
import AppDataSource from "../../data-source";
import { AuthService } from "../services/auth.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { authMiddleware } from "../middleware/auth.middleware";
import { ConfirmResetPasswordDto } from "../dtoes/confirmResetPassword.dto";

const router = Router();
const authService = new AuthService();

router.post("/login", validateDto(LoginDto), async (req: Request, res: Response) => {
  try {
    const dto: LoginDto = (req as any).validatedBody;
    const result = await authService.login(dto.username, dto.password);
    if (!result) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Invalid credentials", HttpStatus.BAD_REQUEST));
      return;
    }
    res.status(HttpStatus.OK).json(success(result));
  } catch (err) {
    console.error("Login error:", err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
  }
});

router.post(
  "/forgot-password",
  validateDto(ForgotPasswordDto),
  async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = (req as any).validatedBody;
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { phoneNumber } });
      if (user) {
        await authService.sendOtp(user, "resetPassword");
      }
      // Always return generic success message
      res.status(HttpStatus.OK).json(success({ message: "If the phone number exists, an OTP has been sent." }));
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
    }
  }
);

router.post("/verifyotp", authMiddleware as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { code } = req.body;

    if (!code) {
      res.status(HttpStatus.BAD_REQUEST).json(error("OTP code is required", HttpStatus.BAD_REQUEST));
      return;
    }

    const ok = await authService.verifyOtp(user, code);

    if (!ok) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Invalid or expired OTP", HttpStatus.BAD_REQUEST));
      return;
    }

    res.status(HttpStatus.OK).json(success({ verified: true }));
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
  }
});

router.post("/sendotp", authMiddleware as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isForResetPassword = !!req.body?.isForResetPassword; // defaults to false if missing

    const result = isForResetPassword ? await authService.sendOtp(user, "resetPassword") : await authService.sendOtp(user);

    res.status(HttpStatus.OK).json(success({
      message: "OTP sent",
      ...result
    }));
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
  }
});

router.post(
  "/confirm-reset-password",
  authMiddleware as any,
  validateDto(ConfirmResetPasswordDto),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { code, newPassword } = (req as any).validatedBody;
      await authService.confirmResetPassword(user, code, newPassword);
      res.status(HttpStatus.OK).json(success({ message: "Password reset successful." }));
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

router.post(
  "/logout",
  authMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      await authService.logout(user);
      res.status(HttpStatus.OK).json(success({ message: "Logged out successfully." }));
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
    }
  }
);

export default router;
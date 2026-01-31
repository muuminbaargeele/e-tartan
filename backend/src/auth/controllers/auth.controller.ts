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
import { VerifyOtpDto } from "../dtoes/verifyOtp.dto";
import logger from "../../utils/logger";

const router = Router();
const authService = new AuthService();

// Regular login (for players and admins - no role restriction)
router.post("/login", validateDto(LoginDto), async (req: Request, res: Response) => {
  try {
    const dto: LoginDto = (req as any).validatedBody;
    const result = await authService.login(dto.username, dto.password);
    if (!result) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Invalid credentials", HttpStatus.BAD_REQUEST));
      return;
    }
    res.status(HttpStatus.OK).json(success(result));
  } catch (err: any) {
    const dto: LoginDto = (req as any).validatedBody || {};
    logger.error({ err, username: dto?.username }, "Login error");
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
  }
});

// Admin-only login endpoint (for admin UI)
router.post("/admin/login", validateDto(LoginDto), async (req: Request, res: Response) => {
  try {
    const dto: LoginDto = (req as any).validatedBody;
    const result = await authService.adminLogin(dto.username, dto.password);
    if (!result) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Invalid credentials or admin access required", HttpStatus.BAD_REQUEST));
      return;
    }
    res.status(HttpStatus.OK).json(success(result));
  } catch (err: any) {
    const dto: LoginDto = (req as any).validatedBody || {};
    logger.error({ err, username: dto?.username }, "Admin login error");
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

// Public OTP verification endpoint (for registration - no auth required)
router.post("/verify-otp", validateDto(VerifyOtpDto), async (req: Request, res: Response) => {
  try {
    const dto: VerifyOtpDto = (req as any).validatedBody;
    const { code, phoneNumber, email } = dto;

    if (!phoneNumber && !email) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Phone number or email is required", HttpStatus.BAD_REQUEST));
      return;
    }

    const result = await authService.verifyOtpPublic(phoneNumber, email, code);

    if (!result.verified) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Invalid or expired OTP", HttpStatus.BAD_REQUEST));
      return;
    }

    res.status(HttpStatus.OK).json(success({ 
      verified: true, 
      message: "OTP verified successfully. You can now login.",
      userId: result.user?.id 
    }));
  } catch (err: any) {
    const dto: VerifyOtpDto = (req as any).validatedBody || {};
    logger.error({ err, phoneNumber: dto?.phoneNumber, email: dto?.email }, "Public OTP verification error");
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR));
  }
});

// Authenticated OTP verification endpoint (for already logged-in users)
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
  } catch (err: any) {
    const user = (req as any).user;
    logger.error({ err, userId: user?.id }, "Authenticated OTP verification error");
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
  } catch (err: any) {
    const user = (req as any).user;
    logger.error({ err, userId: user?.id }, "Send OTP error");
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
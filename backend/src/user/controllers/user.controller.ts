import { Router, Request, Response } from "express";
import { authMiddleware } from "../../auth/middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { UserProfileDto } from "../dtoes/userProfile.dto";
import { CreateUserDto } from "../dtoes/createUser.dto";
import { UpdateUserProfileDto } from "../dtoes/updateUserProfile.dto";
import { ChangePasswordDto } from "../dtoes/changePassword.dto";
import { UpdatePhoneNumberDto } from "../dtoes/updatePhoneNumber.dto";
import { UpdateUsernameDto } from "../dtoes/updateUsername.dto";
import { validateDto } from "../../utils/validateDto";
import AppDataSource from "../../data-source";
import logger from "../../utils/logger";

const router = Router();
const userService = new UserService();

// Get user profile (returns user + player info if applicable)
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

    logger.info({ userId: user.id }, "User profile retrieved");
    res.status(HttpStatus.OK).json(success(profile));
    return;
  } catch (err: any) {
    const user = (req as any).user;
    logger.error({ err, userId: user?.id }, "Get user profile error");
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
    );
    return;
  }
});

// Update user profile (returns same structure as GET for unified page usage)
router.put("/profile", authMiddleware as any, validateDto(UpdateUserProfileDto), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).json(
        error("Unauthorized", HttpStatus.UNAUTHORIZED)
      );
      return;
    }

    const dto: UpdateUserProfileDto = (req as any).validatedBody;
    const profile: UserProfileDto = await userService.updateProfile(user, dto);

    logger.info({ userId: user.id, updatedFields: Object.keys(dto) }, "User profile updated");
    res.status(HttpStatus.OK).json(success(profile));
    return;
  } catch (err: any) {
    const user = (req as any).user;
    const dto: UpdateUserProfileDto = (req as any).validatedBody || {};
    logger.error({ err, userId: user?.id, dto }, "Update user profile error");
    res.status(HttpStatus.BAD_REQUEST).json(
      error(err.message || "Failed to update profile", HttpStatus.BAD_REQUEST)
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

      logger.info({ userId: user.id, username: user.username, otpType }, "User created successfully");
      res.status(HttpStatus.OK).json(
        success({ userId: user.id, username: user.username, otpType })
      );
      return;
    } catch (err: any) {
      const dto: CreateUserDto = (req as any).validatedBody || {};
      logger.error({ err, email: dto?.email, phoneNumber: dto?.phoneNumber }, "Create user error");
      res.status(HttpStatus.BAD_REQUEST).json(
        error(err.message, HttpStatus.BAD_REQUEST)
      );
      return;
    }
  }
);

// Change password (for logged-in users)
router.post(
  "/change-password",
  authMiddleware as any,
  validateDto(ChangePasswordDto),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const dto: ChangePasswordDto = (req as any).validatedBody;
      
      await userService.changePassword(user, dto.currentPassword, dto.newPassword);
      
      logger.info({ userId: user.id }, "Password changed successfully");
      res.status(HttpStatus.OK).json(success({ message: "Password changed successfully." }));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Change password error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
      return;
    }
  }
);

// Update phone number (requires OTP verification)
router.post(
  "/update-phone",
  authMiddleware as any,
  validateDto(UpdatePhoneNumberDto),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const dto: UpdatePhoneNumberDto = (req as any).validatedBody;
      
      const profile = await userService.updatePhoneNumber(user, dto.newPhoneNumber, dto.code);
      
      logger.info({ userId: user.id, newPhoneNumber: dto.newPhoneNumber }, "Phone number updated successfully");
      res.status(HttpStatus.OK).json(success(profile));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Update phone number error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
      return;
    }
  }
);

// Request OTP for phone number update
router.post(
  "/request-phone-otp",
  authMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const { newPhoneNumber } = req.body;

      if (!newPhoneNumber) {
        res.status(HttpStatus.BAD_REQUEST).json(error("New phone number is required", HttpStatus.BAD_REQUEST));
        return;
      }

      // Validate phone number format
      const phoneRegex = /^252\d{9}$/;
      if (!phoneRegex.test(newPhoneNumber) || newPhoneNumber.length !== 12) {
        res.status(HttpStatus.BAD_REQUEST).json(error("Phone number must be in the format 252XXYYYYYYY", HttpStatus.BAD_REQUEST));
        return;
      }

      const result = await userService.requestPhoneUpdateOtp(newPhoneNumber);

      logger.info({ newPhoneNumber, otpType: result.otpType }, "Phone update OTP requested");
      res.status(HttpStatus.OK).json(success({
        message: "OTP sent to new phone number",
        ...result
      }));
      return;
    } catch (err: any) {
      const { newPhoneNumber } = req.body || {};
      logger.error({ err, newPhoneNumber }, "Request phone update OTP error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
      return;
    }
  }
);

// Update username
router.put(
  "/update-username",
  authMiddleware as any,
  validateDto(UpdateUsernameDto),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const dto: UpdateUsernameDto = (req as any).validatedBody;
      
      const profile = await userService.updateUsername(user, dto.newUsername);
      
      logger.info({ userId: user.id, newUsername: dto.newUsername }, "Username updated successfully");
      res.status(HttpStatus.OK).json(success(profile));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Update username error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
      return;
    }
  }
);

// Toggle account activation (activate/deactivate)
router.post(
  "/toggle-activation",
  authMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { activate } = req.body;

      if (typeof activate !== "boolean") {
        res.status(HttpStatus.BAD_REQUEST).json(error("activate must be a boolean (true/false)", HttpStatus.BAD_REQUEST));
        return;
      }

      const profile = await userService.toggleAccountActivation(user, activate);
      
      logger.info({ userId: user.id, activate }, `Account ${activate ? 'activated' : 'deactivated'} successfully`);
      res.status(HttpStatus.OK).json(success({
        ...profile,
        message: activate ? "Account activated successfully" : "Account deactivated successfully"
      }));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Toggle account activation error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
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
      logger.info({ userId: user.id }, "Account deleted successfully");
      res.status(HttpStatus.OK).json(success({ message: "Account deleted successfully." }));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Delete account error");
      res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
      return;
    }
  }
);

export default router;
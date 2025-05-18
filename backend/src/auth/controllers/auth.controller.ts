import { Router, Request } from "express";
import { validateDto } from "../../utils/validateDto";
import { LoginDto } from "../dtoes/login.dto";
import { AuthService } from "../services/auth.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const authService = new AuthService();

router.post("/login", validateDto(LoginDto), async (req: Request, res) => {
  try {
    const dto: LoginDto = (req as any).validatedBody;
    const result = await authService.login(dto.username, dto.password);
    if (!result) {
      res.status(HttpStatus.BAD_REQUEST).json(error("Invalid credentials", HttpStatus.BAD_REQUEST));
      return;
    }
    res.status(HttpStatus.OK).json(success(result));
  } catch (err) {
    console.error("Login error:", err); // Log actual error
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error("Server error", HttpStatus.INTERNAL_SERVER_ERROR));
  }
});



router.post("/verifyotp", authMiddleware as any, async (req: Request, res) => {
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


router.post("/sendotp", authMiddleware as any, async (req: Request, res) => {
  try {
    const user = (req as any).user; 

    const result = await authService.sendOtp(user);

    res.status(HttpStatus.OK).json(success({
      message: "OTP sent",
      ...result
    }));
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(HttpStatus.BAD_REQUEST).json(error(err.message, HttpStatus.BAD_REQUEST));
  }
});

export default router;
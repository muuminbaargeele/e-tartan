import { Router, Request } from "express";
import { validateDto } from "../../utils/validateDto";
import { LoginDto } from "../dtoes/login.dto";
import { AuthService } from "../services/auth.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";

const router = Router();
const authService = new AuthService();

router.post("/login", validateDto(LoginDto), async (req: Request, res) => {
  try {
    const dto: LoginDto = (req as any).validatedBody;
    console.log("DTO:", dto); // Log input
    const result = await authService.login(dto.username, dto.password);
    console.log("Login result:", result); // Log result
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

export default router;
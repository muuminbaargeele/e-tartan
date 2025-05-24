import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/token";
import AppDataSource from "../../data-source";
import { User } from "../../user/entities/user.entity";
import { HttpStatus } from "../../utils/enums";
import { error } from "../../utils/apiResponse";

interface TokenPayload {
  userId: number;
  tokenVersion: number;
}

export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(HttpStatus.UNAUTHORIZED).json(
      error("No token provided", HttpStatus.UNAUTHORIZED, true, HttpStatus.UNAUTHORIZED)
    );
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token) as TokenPayload;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
            where: { id: decoded.userId },
            relations: { role: true, player: true }
        });

    if (!user || user.tokenVersion !== decoded.tokenVersion || user.isDeleted) {
      return res.status(HttpStatus.UNAUTHORIZED).json(
        error("Session expired", HttpStatus.UNAUTHORIZED, true, HttpStatus.UNAUTHORIZED)
      );
    }

    if (!user.role || user.role.name !== "admin") {
      return res.status(HttpStatus.FORBIDDEN).json(
        error("Admin access required", HttpStatus.FORBIDDEN)
      );
    }

    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(HttpStatus.UNAUTHORIZED).json(
      error("Invalid or expired token", HttpStatus.UNAUTHORIZED, true, HttpStatus.UNAUTHORIZED)
    );
  }
}
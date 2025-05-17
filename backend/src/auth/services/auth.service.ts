import { User } from "../../user/entities/user.entity";
import AppDataSource from "../../data-source";
import { verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/token";
import { LoginRespDto } from "../dtoes/login.dto";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async login(username: string, password: string): Promise<LoginRespDto | null> {
    const user = await this.userRepo.findOneBy({ username });
    if (!user) return null;
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await this.userRepo.save(user);

    const token = signToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    return { authToken: token };
  }
}
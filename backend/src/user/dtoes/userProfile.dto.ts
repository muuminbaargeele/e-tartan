import { PlayerProfileDto } from "src/player/dtoes/playerProfile.dto";

export class UserProfileDto {
  userId: number;
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  hasCompleteProfile: boolean;
  playerProfile?: PlayerProfileDto;
}
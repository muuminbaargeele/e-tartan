import { IsString, MinLength } from "class-validator";

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters long" })
  newUsername: string;
}


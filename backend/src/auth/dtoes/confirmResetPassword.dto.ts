import { IsString, MinLength } from "class-validator";

export class ConfirmResetPasswordDto {
  @IsString()
  code: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  newPassword: string;
}
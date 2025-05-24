import { IsString, Matches, Length, Validate } from "class-validator";
import { IsActiveMobilePrefix } from "../..//utils/activeMobilePrefix";

export class ForgotPasswordDto {
  @IsString()
  @Matches(/^252\d{9}$/, { message: "Phone number must be in the format 252XXYYYYYYY" })
  @Length(12, 12, { message: "Phone number must be exactly 12 digits" })
  @Validate(IsActiveMobilePrefix)
  phoneNumber!: string;
}
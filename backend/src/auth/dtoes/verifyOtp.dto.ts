import { IsString, IsOptional, Matches, Length, Validate, IsEmail, ValidateIf } from "class-validator";
import { IsActiveMobilePrefix } from "../../utils/activeMobilePrefix";

export class VerifyOtpDto {
  @IsString()
  code: string;

  @ValidateIf((o) => !o.email)
  @IsString({ message: "Phone number or email is required" })
  @Matches(/^252\d{9}$/, { message: "Phone number must be in the format 252XXYYYYYYY" })
  @Length(12, 12, { message: "Phone number must be exactly 12 digits" })
  @Validate(IsActiveMobilePrefix)
  phoneNumber?: string;

  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  email?: string;
}


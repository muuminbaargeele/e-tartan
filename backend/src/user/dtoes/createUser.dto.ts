import { IsString, IsEmail, MinLength, Matches, Validate, IsOptional } from "class-validator";
import { IsActiveMobilePrefix } from "../../utils/activeMobilePrefix";

export class CreateUserDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^252\d{9}$/, { message: "Phone number must be in the format 252XXYYYYYYY" })
  @Validate(IsActiveMobilePrefix)
  phoneNumber: string;
}
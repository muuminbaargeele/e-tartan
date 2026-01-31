import { IsString, IsEmail, IsOptional } from "class-validator";

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Player profile fields
  @IsOptional()
  @IsString()
  efootballId?: string;

  @IsOptional()
  @IsString()
  efootballUsername?: string;

  @IsOptional()
  @IsString()
  efootballTeamName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}


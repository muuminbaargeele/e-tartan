import { IsString, IsOptional, IsUrl, MinLength } from "class-validator";

export class CreatePlayerProfileDto {
  @IsString()
  @MinLength(1, { message: "eFootball ID is required" })
  efootballId!: string;

  @IsString()
  @MinLength(1, { message: "eFootball Username is required" })
  efootballUsername!: string;

  @IsString()
  @MinLength(1, { message: "eFootball Team Name is required" })
  efootballTeamName!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
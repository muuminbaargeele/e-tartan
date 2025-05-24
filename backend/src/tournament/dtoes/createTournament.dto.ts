import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString, Min, isString } from "class-validator";

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  typeId?: number;

  @IsOptional()
  @IsString()
  statusId?: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(2)
  @IsOptional()
  maxPlayers?: number;

  @IsBoolean()
  @IsOptional()
  isAuto?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string
}
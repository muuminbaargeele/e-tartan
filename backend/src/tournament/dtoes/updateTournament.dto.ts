import { IsOptional, IsString, IsInt, Min, IsDateString, IsBoolean, IsNumber } from "class-validator";

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  typeId?: number;

  @IsOptional()
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxPlayers?: number;

  @IsOptional()
  @IsBoolean()
  isAuto?: boolean;

  @IsOptional()
  @IsInt()
  createdById?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  subscriptionTypeId?: number;
}
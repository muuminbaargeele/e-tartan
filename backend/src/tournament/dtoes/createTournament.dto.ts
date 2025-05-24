import { IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString, Min, IsNumber } from "class-validator";

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  typeId: number;

  @IsInt()
  statusId: number;

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
  @IsInt()
  createdById?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  subscriptionTypeId?: number;

  @IsOptional()
  @IsString()
  promoCode?: string;
}
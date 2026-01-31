import { IsString, IsNotEmpty, ValidateNested, IsOptional } from "class-validator";

export class SetConfigDto {
  @IsString()
  @IsNotEmpty({ message: "Config key is required" })
  key!: string;

  @IsOptional()
  value!: any; // Can be any type (string, number, object, array, boolean)
}



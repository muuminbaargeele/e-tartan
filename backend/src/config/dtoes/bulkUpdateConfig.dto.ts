import { IsArray, ValidateNested, IsString, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";

class ConfigItem {
  @IsString()
  @IsNotEmpty({ message: "Config key is required" })
  key!: string;

  value!: any; // Can be any type
}

export class BulkUpdateConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItem)
  configs!: ConfigItem[];
}



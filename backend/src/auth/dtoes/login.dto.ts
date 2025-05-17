import { IsString, MinLength } from "class-validator";

// DTO for login request
export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// DTO for login response (only returns authToken)
export class LoginRespDto {
  authToken: string;
}
// All shared enums for the project

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  // Add more as needed
}

// Example for other enums:
export enum UserRole {
  ADMIN = "admin",
  PLAYER = "player",
  // Extend as needed
}

export enum OtpPurpose {
  REGISTER = "register",
  LOGIN = "login",
  RESET_PASSWORD = "reset_password",
  OTHER = "other"
}

export enum OtpType {
  SMS = "sms",
  EMAIL = "email",
}

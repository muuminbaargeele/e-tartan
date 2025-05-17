import { HttpStatus } from "./enums";

export interface ApiError {
  sessionExpired?: boolean;
  code: number;
  message: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  payload: {
    result: T | null;
    error: ApiError | null;
  };
}

export function success<T>(result: T, statusCode: HttpStatus = HttpStatus.OK): ApiResponse<T> {
  return {
    statusCode,
    payload: {
      result,
      error: null,
    },
  };
}

export function error(
  message: string,
  code: HttpStatus = HttpStatus.BAD_REQUEST,
  sessionExpired = false,
  statusCode: HttpStatus = HttpStatus.BAD_REQUEST
): ApiResponse<null> {
  return {
    statusCode,
    payload: {
      result: null,
      error: {
        sessionExpired,
        code,
        message,
      },
    },
  };
}
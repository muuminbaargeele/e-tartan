import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { error } from "./apiResponse";
import { HttpStatus } from "./enums";

export function validateDto(DtoClass: any) {
  return async (req, res, next) => {
    const dtoObj = plainToInstance(DtoClass, req.body);
    const errors = await validate(dtoObj);

    if (errors.length > 0) {
      const errorMsg = errors
        .map(e => Object.values(e.constraints || {}).join(", "))
        .join("; ");
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(error(errorMsg, HttpStatus.BAD_REQUEST));
    }

    req.validatedBody = dtoObj; // Optionally pass validated DTO on req
    next();
  };
}
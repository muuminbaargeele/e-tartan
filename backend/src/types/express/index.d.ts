import "express";

declare module "express-serve-static-core" {
  interface Request {
    validatedBody?: any; // Keep it generic
  }
}
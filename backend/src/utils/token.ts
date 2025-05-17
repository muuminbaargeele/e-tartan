import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

export function signToken(
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "365d"
) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}
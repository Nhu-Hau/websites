// src/lib/jwt.ts
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret_dev";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret_dev";

// Kiểu payload cho access token
export type AccessPayload = { id: string; role: string };

// Kiểu payload cho refresh token (kèm jti)
export type RefreshPayload = { id: string; role: string; jti: string };

export function signAccessToken(
  payload: AccessPayload,
  opts?: jwt.SignOptions
) {
  // Tăng thời gian hết hạn lên 30 phút để giảm tần suất refresh
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "30m", ...opts });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload & jwt.JwtPayload;
}

export function newJti() {
  return randomUUID();
}

export function signRefreshToken(
  payload: RefreshPayload,
  opts?: jwt.SignOptions
) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d", ...opts });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload &
    jwt.JwtPayload;
}
export function signGoogleSignupToken(payload: {
  email: string;
  name: string;
  googleId: string;
  picture?: string;
}) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "10m" });
}

export function verifyGoogleSignupToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as {
    email: string;
    name: string;
    googleId: string;
    picture?: string;
  };
}
//auth.service.ts — gom logic lặp (token/cookie/user an toàn)
// src/services/auth.service.ts
import bcrypt from "bcryptjs"; // Chọn 1 loại: bcryptjs cho đồng nhất toàn dự án
import { IUser } from "../models/User";
import {
  signAccessToken,
  signRefreshToken,
  newJti,
  verifyRefreshToken,
} from "../lib/jwt";
import {
  accessCookieName,
  refreshCookieName,
  accessCookieOpts,
  refreshCookieOpts,
} from "../config/cookies";

export function toSafeUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    level: user.level,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function issueAndStoreTokens(user: IUser) {
  const id = user._id.toString();
  const access = signAccessToken({ id, role: user.role });

  const jti = newJti();
  const refresh = signRefreshToken({ id, role: user.role, jti });

  user.refreshTokenHash = await bcrypt.hash(jti, 10);
  user.refreshTokenExp = new Date(Date.now() + (refreshCookieOpts.maxAge || 0));
  await user.save();

  return { access, refresh };
}

export function setAuthCookies(res: any, access: string, refresh?: string) {
  res.cookie(accessCookieName, access, accessCookieOpts);
  if (refresh) res.cookie(refreshCookieName, refresh, refreshCookieOpts);
}

export function clearAuthCookies(res: any) {
  res.clearCookie(accessCookieName, { path: accessCookieOpts.path });
  res.clearCookie(refreshCookieName, { path: refreshCookieOpts.path });
}

export async function refreshAccessToken(rt: string, user: IUser) {
  const payload = verifyRefreshToken(rt); // sẽ throw nếu token hỏng
  if (!user.refreshTokenHash) throw new Error("Unauthorized");
  const bcryptjs = await import("bcryptjs");
  const ok = await bcryptjs.compare(payload.jti, user.refreshTokenHash);
  if (!ok) throw new Error("Unauthorized");
  return signAccessToken({ id: user.id, role: user.role });
}

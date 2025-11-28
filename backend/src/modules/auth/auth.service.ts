//auth.service.ts — gom logic lặp (token/cookie/user an toàn)
// src/services/auth.service.ts
import bcrypt from "bcryptjs"; // Chọn 1 loại: bcryptjs cho đồng nhất toàn dự án
import { IUser } from "../../shared/models/User";
import {
  signAccessToken,
  signRefreshToken,
  newJti,
  verifyRefreshToken,
} from "../../shared/services/jwt.service";
import {
  accessCookieName,
  refreshCookieName,
  accessCookieOpts,
  refreshCookieOpts,
} from "../../config/cookies";

export function toSafeUser(u: IUser) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    access: u.access,
    levelUpdatedAt: u.levelUpdatedAt,
    levelSource: u.levelSource,
    lastPlacementAttemptId: u.lastPlacementAttemptId,
    picture: u.picture,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    last_login: u.last_login,

    // NEW:
    partLevels: u.partLevels
      ? Object.fromEntries(
        (u.partLevels as any)?.entries?.() || Object.entries(u.partLevels)
      )
      : {},
    toeicPred: u.toeicPred || { overall: 0, listening: 0, reading: 0 },
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

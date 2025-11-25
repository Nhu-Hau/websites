// src/config/cookies.ts
import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

// Lấy domain từ env nếu có (cho VPS khi frontend và backend ở domain khác nhau)
const getCookieDomain = (): string | undefined => {
  const domain = process.env.COOKIE_DOMAIN;
  if (domain && domain.trim()) {
    return domain.trim();
  }
  return undefined; // undefined = cookie sẽ được set cho domain hiện tại
};

const cookieDomain = getCookieDomain();

export const accessCookieName = "access_token";
export const refreshCookieName = "refresh_token";
export const signupCookieName = "google_signup";
export const signupCookieOpts = {
  httpOnly: true,
  secure: isProd ? true : false,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
} as const;

export const accessCookieOpts: CookieOptions = {
  httpOnly: true,
  secure: isProd ? true : false,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 30 * 60 * 1000, // 30 phút để khớp với token expiration
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const refreshCookieOpts: CookieOptions = {
  httpOnly: true,
  secure: isProd ? true : false,
  sameSite: isProd ? "none" : "lax",
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const placementTestCookieName = "placement_test";
export const placementTestCookieOpts: CookieOptions = {
  httpOnly: true,
  secure: isProd ? true : false,
  sameSite: isProd ? "none" : "lax",
  path: "/api/placement",
  maxAge: 2 * 60 * 60 * 1000, // 2 hours to finish an attempt
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

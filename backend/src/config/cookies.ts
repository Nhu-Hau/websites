// src/config/cookies.ts
import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const accessCookieName = "access_token";
export const refreshCookieName = "refresh_token";
export const signupCookieName = "google_signup";
export const signupCookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/", 
  maxAge: 10 * 60 * 1000, 
} as const;

export const accessCookieOpts: CookieOptions = {
  httpOnly: true,
  secure: isProd ? true : false,
  sameSite: isProd ? "none" : "lax", 
  path: "/",
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOpts: CookieOptions = {
  httpOnly: true,
  secure: isProd ? true : false,
  sameSite: isProd ? "none" : "lax",
  path: "/api/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

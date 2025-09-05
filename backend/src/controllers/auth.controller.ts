// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import passport from "../lib/passport";
import { User, IUser } from "../models/User";
import {
  toSafeUser,
  issueAndStoreTokens,
  setAuthCookies,
  clearAuthCookies,
  refreshAccessToken,
} from "../services/auth.service";
import {
  signGoogleSignupToken,
  verifyGoogleSignupToken,
} from "../lib/jwt";
import { signupCookieName, signupCookieOpts } from "../config/cookies";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// GET /auth/me
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    return res.status(200).json(toSafeUser(user));
  } catch (e) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

// POST /auth/logout
export function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  return res.status(200).json({ message: "Đăng xuất thành công" });
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response) {
  try {
    const rt = req.cookies?.refresh_token;
    if (!rt) return res.status(401).json({ message: "Không có refresh token" });

    const userId = (req as any).auth?.userId ?? null;
    const user = userId ? await User.findById(userId) : null;
    if (!user) return res.status(401).json({ message: "Người dùng không hợp lệ" });

    const access = await refreshAccessToken(rt, user);
    setAuthCookies(res, access);

    return res.status(200).json({ message: "Cấp mới access token thành công" });
  } catch (e) {
    return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
  }
}

// POST /auth/register
export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, level } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Vui lòng điền đủ các trường bắt buộc" });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email này đã được sử dụng" });

    const user: IUser = await User.create({
      name,
      email,
      password,
      level: level ?? "beginner",
    });

    const { access, refresh } = await issueAndStoreTokens(user);
    setAuthCookies(res, access, refresh);

    return res.status(201).json({
      user: toSafeUser(user),
      message: "Đăng ký tài khoản thành công",
    });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi đăng ký tài khoản" });
  }
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });

    const { access, refresh } = await issueAndStoreTokens(user);
    setAuthCookies(res, access, refresh);

    return res.status(200).json({
      user: toSafeUser(user),
      message: "Đăng nhập thành công",
    });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi đăng nhập" });
  }
}

// GET /auth/google
export const google = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
  prompt: "select_account",
});

// GET /auth/google/callback
export function googleCallback(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    "google",
    { session: false },
    async (err, profile: any) => {
      if (err) return res.status(500).json({ message: "Lỗi xác thực Google" });
      try {
        const email = profile?.email;
        if (!email)
          return res.redirect(`${CLIENT_URL}/auth/login?err=khong_co_email`);

        const user = await User.findOne({ email });
        if (user) {
          const { access, refresh } = await issueAndStoreTokens(user);
          setAuthCookies(res, access, refresh);
          return res.redirect(`${CLIENT_URL}/homePage`);
        }

        const signupToken = signGoogleSignupToken({
          email,
          name: profile.displayName,
          googleId: profile.id,
          // picture: profile.photo,
        });
        res.cookie(signupCookieName, signupToken, signupCookieOpts);
        return res.redirect(`${CLIENT_URL}/vi/auth/complete-google`);
      } catch (e) {
        return res
          .status(500)
          .json({ message: "Có lỗi xảy ra khi xử lý callback Google" });
      }
    }
  )(req, res, next);
}

// POST /auth/google/complete
export async function completeGoogle(req: Request, res: Response) {
  try {
    const token = req.cookies?.[signupCookieName];
    if (!token)
      return res.status(401).json({ message: "Phiên đăng ký đã hết hạn" });

    const { email, name, googleId } = verifyGoogleSignupToken(token);

    const { password } = req.body || {};
    if (!password || password.length < 8)
      return res
        .status(400)
        .json({ message: "Mật khẩu quá ngắn, tối thiểu 8 ký tự" });

    if (await User.findOne({ email })) {
      res.clearCookie(signupCookieName, { path: "/" });
      return res
        .status(409)
        .json({ message: "Tài khoản đã tồn tại, vui lòng đăng nhập" });
    }

    const user = await User.create({
      email,
      name,
      password,
      role: "free",
      level: "beginner",
      googleId,
      provider: "google",
    });

    const { access, refresh } = await issueAndStoreTokens(user);
    setAuthCookies(res, access, refresh);
    res.clearCookie(signupCookieName, { path: "/" });

    return res.status(201).json({
      user: toSafeUser(user),
      message: "Đăng ký bằng Google thành công",
    });
  } catch (e) {
    return res
      .status(400)
      .json({ message: "Phiên đăng ký Google không hợp lệ hoặc đã hết hạn" });
  }
}

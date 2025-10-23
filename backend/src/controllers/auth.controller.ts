// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import passport from "../lib/passport";
import { User, IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { extractKeyFromUrl, safeDeleteS3, BUCKET, uploadBufferToS3 } from "../lib/s3";
import {
  toSafeUser,
  issueAndStoreTokens,
  setAuthCookies,
  clearAuthCookies,
  refreshAccessToken,
} from "../services/auth.service";
import { signGoogleSignupToken, verifyGoogleSignupToken } from "../lib/jwt";
import { signupCookieName, signupCookieOpts } from "../config/cookies";
import { ResetTokenModel } from "../models/ResetToken";
import { sendMail } from "../lib/mailer";
import { PasswordCodeModel } from "../models/PasswordCode";

const RESET_SECRET = process.env.RESET_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

/** Cập nhật avatar người dùng (multer.memoryStorage -> req.file) */
export async function uploadAvatar(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const f = (req as any).file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ message: "Thiếu file" });

    // 1) Upload ảnh mới lên S3 (gợi ý: lib/s3 đã phân loại type= image/file)
    const { url, key } = await uploadBufferToS3({
      buffer: f.buffer,
      mime: f.mimetype,
      originalName: f.originalname,
      folder: "avatar", // ⟵ lưu vào s3://project.toeic/avatar/
    });

    // 2) Xoá avatar cũ (nếu có)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldUrl = user.picture;
    if (oldUrl) {
      const oldKey = extractKeyFromUrl(BUCKET, oldUrl);
      if (oldKey) {
        try {
          await safeDeleteS3(oldKey);
        } catch (e) {
          console.warn(
            "[uploadAvatar] Failed to delete old avatar:",
            oldKey,
            e
          );
        }
      }
    }

    // 3) Lưu url mới
    user.picture = url;
    await user.save();

    return res.json({ ok: true, picture: url, key });
  } catch (e) {
    console.error("[uploadAvatar] ERROR", e);
    return res.status(500).json({ message: "Upload avatar failed" });
  }
}

export async function deleteAvatar(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.picture)
      return res.status(400).json({ message: "No avatar to delete" });

    // Xoá trên S3
    const key = extractKeyFromUrl(BUCKET, user.picture);
    if (key) {
      console.log(`[deleteAvatar] deleting key: ${key}`);
      await safeDeleteS3(key);
    }

    // Xoá DB
    user.picture = undefined;
    await user.save();

    return res.json({ ok: true, message: "Avatar deleted successfully" });
  } catch (e) {
    console.error("[deleteAvatar] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /auth/me
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

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
    if (!user)
      return res.status(401).json({ message: "Người dùng không hợp lệ" });

    const access = await refreshAccessToken(rt, user);
    setAuthCookies(res, access);

    return res.status(200).json({ message: "Cấp mới access token thành công" });
  } catch (e) {
    return res
      .status(401)
      .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
  }
}

// POST /auth/register
// POST /auth/register
export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, level } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Vui lòng điền đủ các trường bắt buộc" });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email này đã được sử dụng" });

    const user: IUser = await User.create({
      name,
      email,
      password,
      role: "user",
      access: "free",
      level: level ?? 1,
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

    // Kiểm tra nếu người dùng có tồn tại trong database
    const user: IUser | null = await User.findOne({ email });

    // Nếu không có người dùng, trả về thông báo "Chưa có tài khoản"
    if (!user) {
      return res.status(404).json({ message: "Bạn chưa có tài khoản" });
    }

    // Nếu có người dùng nhưng mật khẩu không đúng, trả về thông báo "Email hoặc mật khẩu không chính xác"
    if (!(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    // Nếu người dùng tồn tại và mật khẩu chính xác, cấp token và lưu cookies
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
export function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
          return res.redirect(`${CLIENT_URL}/homePage?auth=login_success`);
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
      role: "user",
      access: "free",
      level: 1,
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

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ message: "Thiếu email" });

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      code: "EMAIL_NOT_FOUND",
      message: "Email này chưa đăng ký tài khoản.",
    });
  }

  /** A) Tạo LINK reset (giữ nguyên logic hiện tại) */
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: user.id, jti, kind: "reset" }, RESET_SECRET, {
    expiresIn: "15m",
  });
  await ResetTokenModel.create({
    userId: user.id,
    jti,
    used: false,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  const resetUrl = `${CLIENT_URL}/auth/reset-password?token=${encodeURIComponent(
    token
  )}`;

  /** B) Tạo MÃ OTP 6 số (mặc định 10 phút) */
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  // đơn giản: vô hiệu các mã cũ chưa dùng cho email này
  await PasswordCodeModel.deleteMany({ email, used: false });
  await PasswordCodeModel.create({
    email,
    codeHash,
    used: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  /** C) Gửi email: cả LINK và MÃ để người dùng chọn cách thuận tiện */
  await sendMail({
    to: email,
    subject: "Đặt lại mật khẩu",
    html: `
      <p>Chào ${user.name || "bạn"},</p>
      <p>• <b>Mã xác nhận</b> (hiệu lực 10 phút):</p>
      <p style="font-size:20px;font-weight:700;letter-spacing:3px">${code}</p>
      <hr />
    `,
  });

  return res.json({
    message:
      "Vui lòng kiểm tra email để lấy mã xác nhận hoặc liên kết đặt lại mật khẩu.",
  });
}

/** ĐỔI MẬT KHẨU BẰNG LINK TOKEN (giữ như cũ) */
export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password)
    return res.status(400).json({ message: "Thiếu dữ liệu" });

  try {
    const payload = jwt.verify(token, RESET_SECRET) as {
      sub: string;
      jti: string;
      kind: string;
    };
    if (payload.kind !== "reset")
      return res.status(400).json({ message: "Token không hợp lệ" });

    const saved = await ResetTokenModel.findOne({ jti: payload.jti });
    if (!saved || saved.used)
      return res
        .status(400)
        .json({ message: "Token đã dùng hoặc không hợp lệ" });
    if (saved.expiresAt.getTime() < Date.now())
      return res.status(400).json({ message: "Token đã hết hạn" });

    const user = await User.findById(payload.sub);
    if (!user)
      return res.status(400).json({ message: "Người dùng không tồn tại" });

    user.password = password;
    await user.save();

    saved.used = true;
    await saved.save();

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch {
    return res
      .status(400)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

/** THÊM: ĐỔI MẬT KHẨU BẰNG MÃ OTP */
export async function resetPasswordCode(req: Request, res: Response) {
  const { email, code, password } = req.body as {
    email?: string;
    code?: string;
    password?: string;
  };
  if (!email || !code || !password)
    return res.status(400).json({ message: "Thiếu dữ liệu" });

  const entry = await PasswordCodeModel.findOne({ email, used: false });
  if (!entry)
    return res.status(400).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });
  if (entry.expiresAt.getTime() < Date.now())
    return res.status(400).json({ message: "Mã đã hết hạn" });

  const ok = await bcrypt.compare(code, entry.codeHash);
  if (!ok) return res.status(400).json({ message: "Mã không đúng" });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Người dùng không tồn tại" });

  user.password = password;
  await user.save();

  entry.used = true;
  await entry.save();

  return res.json({ message: "Đổi mật khẩu thành công" });
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    const { oldPassword, newPassword, confirmNewPassword } = req.body as {
      oldPassword?: string;
      newPassword?: string;
      confirmNewPassword?: string;
    };

    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận",
      });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới tối thiểu 8 ký tự" });
    }
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ message: "Xác nhận mật khẩu mới không khớp" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // So sánh bằng method của model để đồng bộ thư viện bcrypt
    const oldOk = await user.comparePassword(oldPassword);
    if (!oldOk)
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });

    // Không cho trùng với mật khẩu cũ
    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới không được trùng mật khẩu cũ" });
    }

    // Cập nhật (pre-save hook của User sẽ tự hash)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch {
    return res.status(500).json({ message: "Lỗi khi đổi mật khẩu" });
  }
}

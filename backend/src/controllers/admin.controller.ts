import { Request, Response } from "express";
import { User } from "../models/User";
import { PlacementAttempt } from "../models/PlacementAttempt";

export async function listUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "").trim();
    const access = String(req.query.access || "").trim();

    const filter: any = {};
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ];
    }
    if (role) filter.role = role;
    if (access) filter.access = access;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id name email role access level createdAt updatedAt"),
      User.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { name, role, access, level } = req.body as {
      name?: string;
      role?: "user" | "admin" | "teacher";
      access?: "free" | "premium";
      level?: 1 | 2 | 3;
    };

    const allowed: any = {};
    if (typeof name === "string" && name.trim()) allowed.name = name.trim();
    if (role === "user" || role === "admin" || role === "teacher") allowed.role = role;
    if (access === "free" || access === "premium") allowed.access = access;
    if ([1, 2, 3].includes(Number(level))) allowed.level = Number(level);

    const user = await User.findByIdAndUpdate(id, { $set: allowed }, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json({ user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      access: user.access,
      level: user.level,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }});
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi cập nhật người dùng" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const meId = (req as any).auth?.userId;
    if (meId && String(meId) === String(id)) {
      return res.status(400).json({ message: "Không thể tự xóa tài khoản của chính mình" });
    }
    const r = await User.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json({ message: "Đã xóa người dùng" });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi xóa người dùng" });
  }
}

// GET /api/admin/analytics/overview
export async function overviewPlacementScores(_req: Request, res: Response) {
  try {
    // Lấy latest placement attempt theo user (qua lastPlacementAttemptId)
    const users = await User.find({ lastPlacementAttemptId: { $ne: null } })
      .select("_id lastPlacementAttemptId level")
      .lean();

    const attemptIds = users
      .map((u: any) => u.lastPlacementAttemptId)
      .filter(Boolean);

    if (attemptIds.length === 0) {
      return res.json({
        totalUsers: 0,
        avgOverall: 0,
        byLevel: { 1: 0, 2: 0, 3: 0 },
        histogram: [],
      });
    }

    const attempts = await PlacementAttempt.find({ _id: { $in: attemptIds } })
      .select("listening reading submittedAt userId")
      .lean();

    // Tính điểm ước lượng giống placement.controller
    const toToeic = (acc: number) => Math.max(0, Math.min(495, Math.round((acc || 0) * 495)));

    const userIdToAttempt: Record<string, any> = {};
    for (const a of attempts) {
      userIdToAttempt[String(a.userId)] = a;
    }

    let sumOverall = 0;
    const histBuckets: { min: number; max: number; count: number }[] = [
      { min: 0, max: 200, count: 0 },
      { min: 200, max: 400, count: 0 },
      { min: 400, max: 600, count: 0 },
      { min: 600, max: 800, count: 0 },
      { min: 800, max: 1000, count: 0 },
    ];
    const byLevel: Record<1|2|3, number> = { 1: 0, 2: 0, 3: 0 };

    for (const u of users as any[]) {
      const a = userIdToAttempt[String(u._id)];
      if (!a) continue;
      const listening = toToeic(a.listening?.acc || 0);
      const reading = toToeic(a.reading?.acc || 0);
      const overall = listening + reading; // 0..990
      sumOverall += overall;

      // Histogram
      const b = histBuckets.find((b) => overall >= b.min && overall < b.max + (b.max === 1000 ? 0 : 0));
      if (b) b.count++;

      // Level
      if ([1,2,3].includes(u.level)) byLevel[u.level as 1|2|3]++;
    }

    const totalUsers = attempts.length;
    const avgOverall = totalUsers ? Math.round(sumOverall / totalUsers) : 0;

    return res.json({ totalUsers, avgOverall, byLevel, histogram: histBuckets });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi tổng hợp dữ liệu" });
  }
}

// GET /api/admin/analytics/user-scores
export async function userScores(_req: Request, res: Response) {
  try {
    const users = await User.find({ lastPlacementAttemptId: { $ne: null } })
      .select("_id name email level lastPlacementAttemptId")
      .lean();

    const attemptIds = users
      .map((u: any) => u.lastPlacementAttemptId)
      .filter(Boolean);

    if (attemptIds.length === 0) {
      return res.json({ users: [] });
    }

    const attempts = await PlacementAttempt.find({ _id: { $in: attemptIds } })
      .select("listening reading submittedAt userId")
      .lean();

    const toToeic = (acc: number) => Math.max(0, Math.min(495, Math.round((acc || 0) * 495)));
    const userIdToAttempt: Record<string, any> = {};
    for (const a of attempts) {
      userIdToAttempt[String(a.userId)] = a;
    }

    const userScores = users
      .map((u: any) => {
        const a = userIdToAttempt[String(u._id)];
        if (!a) return null;
        const listening = toToeic(a.listening?.acc || 0);
        const reading = toToeic(a.reading?.acc || 0);
        const overall = listening + reading;
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          level: u.level,
          overall,
          listening,
          reading,
          submittedAt: a.submittedAt,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.overall - a.overall);

    return res.json({ users: userScores });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi lấy điểm người dùng" });
  }
}



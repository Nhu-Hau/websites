import { Request, Response } from "express";
import mongoose from "mongoose";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { User } from "../../shared/models/User";
import { PlacementAttempt } from "../../shared/models/PlacementAttempt";
import { ProgressAttempt } from "../../shared/models/ProgressAttempt";
import { PracticeAttempt } from "../../shared/models/PracticeAttempt";

const execAsync = promisify(exec);

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
    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        access: user.access,
        level: user.level,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
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
      { min: 0, max: 99, count: 0 },
      { min: 100, max: 199, count: 0 },
      { min: 200, max: 299, count: 0 },
      { min: 300, max: 399, count: 0 },
      { min: 400, max: 499, count: 0 },
      { min: 500, max: 599, count: 0 },
      { min: 600, max: 699, count: 0 },
      { min: 700, max: 799, count: 0 },
      { min: 800, max: 899, count: 0 },
      { min: 900, max: 990, count: 0 },
    ];
    const byLevel: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };

    for (const u of users as any[]) {
      const a = userIdToAttempt[String(u._id)];
      if (!a) continue;
      const listening = toToeic(a.listening?.acc || 0);
      const reading = toToeic(a.reading?.acc || 0);
      const overall = listening + reading; // 0..990
      sumOverall += overall;

      // Histogram
      const b = histBuckets.find((b) => overall >= b.min && overall <= b.max);
      if (b) b.count++;

      // Level
      if ([1, 2, 3].includes(u.level)) byLevel[u.level as 1 | 2 | 3]++;
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

// GET /api/admin/analytics/user-toeic-pred
export async function userToeicPred(_req: Request, res: Response) {
  try {
    const users = await User.find({ toeicPred: { $ne: null } })
      .select("_id name email level toeicPred")
      .lean();

    const userToeicPreds = users
      .map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        level: u.level,
        toeicPred: u.toeicPred || { overall: null, listening: null, reading: null },
      }))
      .sort((a: any, b: any) => {
        const aOverall = a.toeicPred?.overall ?? 0;
        const bOverall = b.toeicPred?.overall ?? 0;
        return bOverall - aOverall;
      });

    return res.json({ users: userToeicPreds });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi lấy điểm TOEIC dự đoán" });
  }
}

// GET /api/admin/analytics/visitor-count
export async function visitorCount(_req: Request, res: Response) {
  try {
    const totalUsers = await User.countDocuments();

    // Unique visitors trong 30 ngày gần nhất (users có placement attempt trong 30 ngày)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttempts = await PlacementAttempt.find({
      submittedAt: { $gte: thirtyDaysAgo }
    })
      .select("userId")
      .lean();

    const uniqueUserIds = new Set(recentAttempts.map((a: any) => String(a.userId)));
    const uniqueVisitorsLast30Days = uniqueUserIds.size;

    return res.json({
      totalVisits: totalUsers, // Tổng số users đã đăng ký
      uniqueVisitorsLast30Days,
    });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi lấy số lượng visitor" });
  }
}

// GET /api/admin/analytics/online-users
export async function onlineUsersCount(_req: Request, res: Response) {
  try {
    // Số người đang online (kết nối socket)
    const io = (global as any).io;
    let onlineUsers = 0;
    if (io) {
      const { getOnlineUsersCount } = await import("../../shared/services/socket.service");
      onlineUsers = getOnlineUsersCount(io);
    }

    // Số người hoạt động trong 5 phút gần nhất (dựa trên attempts)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const [placementAttempts, progressAttempts, practiceAttempts] = await Promise.all([
      PlacementAttempt.find({
        submittedAt: { $gte: fiveMinutesAgo }
      }).select("userId").lean(),
      ProgressAttempt.find({
        submittedAt: { $gte: fiveMinutesAgo }
      }).select("userId").lean(),
      PracticeAttempt.find({
        submittedAt: { $gte: fiveMinutesAgo }
      }).select("userId").lean(),
    ]);

    const uniqueUserIds = new Set<string>();
    [...placementAttempts, ...progressAttempts, ...practiceAttempts].forEach((a: any) => {
      if (a.userId) uniqueUserIds.add(String(a.userId));
    });

    const activeUsers = uniqueUserIds.size;

    return res.json({ onlineUsers, activeUsers });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi lấy số lượng người dùng online" });
  }
}

// GET /api/admin/attempts/placement
export async function listPlacementAttempts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const userId = String(req.query.userId || "").trim();

    const filter: any = {};
    if (userId && mongoose.isValidObjectId(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      PlacementAttempt.find(filter)
        .populate("userId", "name email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlacementAttempt.countDocuments(filter),
    ]);

    const toToeic = (acc: number) => Math.max(0, Math.min(495, Math.round((acc || 0) * 495)));

    const items = attempts.map((a: any) => ({
      _id: String(a._id),
      userId: String(a.userId?._id || a.userId),
      userName: a.userId?.name || "Unknown",
      userEmail: a.userId?.email || "",
      total: a.total || 0,
      correct: a.correct || 0,
      acc: a.acc || 0,
      listening: {
        total: a.listening?.total || 0,
        correct: a.listening?.correct || 0,
        acc: a.listening?.acc || 0,
        score: toToeic(a.listening?.acc || 0),
      },
      reading: {
        total: a.reading?.total || 0,
        correct: a.reading?.correct || 0,
        acc: a.reading?.acc || 0,
        score: toToeic(a.reading?.acc || 0),
      },
      level: a.level || 1,
      predicted: a.predicted || null,
      overall: toToeic(a.listening?.acc || 0) + toToeic(a.reading?.acc || 0),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : new Date().toISOString(),
    }));

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách placement attempts" });
  }
}

// GET /api/admin/attempts/progress
export async function listProgressAttempts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const userId = String(req.query.userId || "").trim();

    const filter: any = {};
    if (userId && mongoose.isValidObjectId(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      ProgressAttempt.find(filter)
        .populate("userId", "name email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProgressAttempt.countDocuments(filter),
    ]);

    const toToeic = (acc: number) => Math.max(0, Math.min(495, Math.round((acc || 0) * 495)));

    const items = attempts.map((a: any) => ({
      _id: String(a._id),
      userId: String(a.userId?._id || a.userId),
      userName: a.userId?.name || "Unknown",
      userEmail: a.userId?.email || "",
      total: a.total || 0,
      correct: a.correct || 0,
      acc: a.acc || 0,
      listening: {
        total: a.listening?.total || 0,
        correct: a.listening?.correct || 0,
        acc: a.listening?.acc || 0,
        score: toToeic(a.listening?.acc || 0),
      },
      reading: {
        total: a.reading?.total || 0,
        correct: a.reading?.correct || 0,
        acc: a.reading?.acc || 0,
        score: toToeic(a.reading?.acc || 0),
      },
      level: a.level || 1,
      predicted: a.predicted || null,
      overall: toToeic(a.listening?.acc || 0) + toToeic(a.reading?.acc || 0),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : new Date().toISOString(),
    }));

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách progress attempts" });
  }
}

// GET /api/admin/attempts/practice
export async function listPracticeAttempts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(1000, parseInt(String(req.query.limit || "20"), 10) || 20));
    const userId = String(req.query.userId || "").trim();
    const partKey = String(req.query.partKey || "").trim();
    const level = req.query.level ? parseInt(String(req.query.level), 10) : undefined;

    const filter: any = {};
    if (userId && mongoose.isValidObjectId(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }
    if (partKey) {
      filter.partKey = partKey;
    }
    if (level !== undefined && [1, 2, 3].includes(level)) {
      filter.level = level;
    }

    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      PracticeAttempt.find(filter)
        .populate("userId", "name email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PracticeAttempt.countDocuments(filter),
    ]);

    const items = attempts.map((a: any) => ({
      _id: String(a._id),
      userId: String(a.userId?._id || a.userId),
      userName: a.userId?.name || "Unknown",
      userEmail: a.userId?.email || "",
      partKey: a.partKey || "",
      level: a.level || 1,
      test: a.test || null,
      total: a.total || 0,
      correct: a.correct || 0,
      acc: a.acc || 0,
      timeSec: a.timeSec || 0,
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : new Date().toISOString(),
      isRetake: a.isRetake || false,
    }));

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách practice attempts" });
  }
}

// DELETE /api/admin/attempts/placement/:id
export async function deletePlacementAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const attempt = await PlacementAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy bài làm placement" });
    }

    const userId = attempt.userId;

    // Xóa attempt
    await attempt.deleteOne();

    // Kiểm tra xem đây có phải là lastPlacementAttemptId của user không
    const user = await User.findById(userId);
    if (user && user.lastPlacementAttemptId && String(user.lastPlacementAttemptId) === id) {
      // Tìm attempt mới nhất khác (nếu có)
      const latestAttempt = await PlacementAttempt.findOne({ userId })
        .sort({ submittedAt: -1 })
        .select("_id");

      if (latestAttempt) {
        user.lastPlacementAttemptId = latestAttempt._id;
      } else {
        user.lastPlacementAttemptId = undefined;
        user.level = 1; // Reset về level 1 nếu không còn attempt nào
        user.toeicPred = undefined; // Xóa TOEIC prediction
      }
      await user.save();
    }

    return res.json({ message: "Đã xóa bài làm placement" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi xóa bài làm placement" });
  }
}

// DELETE /api/admin/attempts/progress/:id
export async function deleteProgressAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const attempt = await ProgressAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy bài làm progress" });
    }

    await attempt.deleteOne();
    return res.json({ message: "Đã xóa bài làm progress" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi xóa bài làm progress" });
  }
}

// DELETE /api/admin/attempts/practice/:id
export async function deletePracticeAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const attempt = await PracticeAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy bài làm practice" });
    }

    await attempt.deleteOne();
    return res.json({ message: "Đã xóa bài làm practice" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi xóa bài làm practice" });
  }
}

// DELETE /api/admin/analytics/user-score/:userId - Xóa placement attempt của user (xóa điểm trong tab Tổng quan)
export async function deleteUserScore(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (!user.lastPlacementAttemptId) {
      return res.status(404).json({ message: "Người dùng chưa có bài làm placement" });
    }

    const attemptId = user.lastPlacementAttemptId;

    // Xóa attempt
    await PlacementAttempt.findByIdAndDelete(attemptId);

    // Reset user
    user.lastPlacementAttemptId = undefined;
    user.level = 1;
    user.toeicPred = undefined;
    await user.save();

    return res.json({ message: "Đã xóa điểm placement của người dùng" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi xóa điểm người dùng" });
  }
}

// DELETE /api/admin/analytics/user-toeic-pred/:userId - Xóa TOEIC prediction của user
export async function deleteUserToeicPred(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    user.toeicPred = undefined;
    await user.save();

    return res.json({ message: "Đã xóa điểm TOEIC dự đoán của người dùng" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi khi xóa điểm TOEIC dự đoán" });
  }
}

// GET /api/admin/analytics/vps-stats
export async function vpsStats(_req: Request, res: Response) {
  try {
    // CPU Usage - cần đo 2 lần để tính chính xác
    const cpus1 = os.cpus();
    const total1 = cpus1.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
    }, 0);
    const idle1 = cpus1.reduce((acc, cpu) => acc + cpu.times.idle, 0);

    // Đợi 100ms để đo lần 2
    await new Promise(resolve => setTimeout(resolve, 100));

    const cpus2 = os.cpus();
    const total2 = cpus2.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
    }, 0);
    const idle2 = cpus2.reduce((acc, cpu) => acc + cpu.times.idle, 0);

    const totalDiff = total2 - total1;
    const idleDiff = idle2 - idle1;
    const cpuUsage = totalDiff > 0 ? Math.max(0, Math.min(100, Math.round(100 - (idleDiff / totalDiff) * 100))) : 0;

    // Memory Usage (Real Memory)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);

    // Virtual Memory (Swap) - Lấy từ Ubuntu bằng lệnh free hoặc /proc/meminfo
    let virtualMemoryUsage = 0;
    try {
      const platform = os.platform();
      if (platform === "linux") {
        // Ubuntu: sử dụng lệnh free để lấy swap usage
        // free -m | grep Swap | awk '{print ($3/$2)*100}' hoặc đọc /proc/meminfo
        try {
          // Cách 1: Dùng lệnh free (chính xác hơn)
          const { stdout } = await execAsync("free -m | grep Swap");
          const swapParts = stdout.trim().split(/\s+/);
          if (swapParts.length >= 3) {
            const swapTotal = parseInt(swapParts[1], 10); // Total swap in MB
            const swapUsed = parseInt(swapParts[2], 10); // Used swap in MB
            if (swapTotal > 0) {
              virtualMemoryUsage = Math.round((swapUsed / swapTotal) * 100);
            }
          }
        } catch (freeError) {
          // Fallback: Đọc từ /proc/meminfo
          try {
            const { stdout } = await execAsync("grep -E '^SwapTotal:|^SwapFree:' /proc/meminfo | awk '{print $2}'");
            const swapValues = stdout.trim().split('\n').map(v => parseInt(v, 10));
            if (swapValues.length >= 2 && swapValues[0] > 0) {
              const swapTotal = swapValues[0]; // KB
              const swapFree = swapValues[1]; // KB
              const swapUsed = swapTotal - swapFree;
              virtualMemoryUsage = Math.round((swapUsed / swapTotal) * 100);
            }
          } catch (meminfoError) {
            console.error("Error getting swap from /proc/meminfo:", meminfoError);
          }
        }
      } else {
        // Windows/Mac: không có swap, set về 0
        virtualMemoryUsage = 0;
      }
    } catch (swapError) {
      console.error("Error getting swap memory:", swapError);
      virtualMemoryUsage = 0;
    }

    // Disk Space - sử dụng exec command để lấy disk space
    let diskUsage = 0;
    try {
      const platform = os.platform();
      let command: string;

      if (platform === "win32") {
        // Windows: sử dụng wmic
        command = 'wmic logicaldisk get size,freespace,caption';
        const { stdout } = await execAsync(command);
        // Parse output để lấy disk space của ổ C:
        const lines = stdout.split("\n").filter(line => line.trim() && !line.includes("Caption"));
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          if (parts.length >= 2) {
            const freeSpace = parseInt(parts[parts.length - 2] || "0", 10);
            const totalSpace = parseInt(parts[parts.length - 1] || "0", 10);
            if (totalSpace > 0) {
              diskUsage = Math.round(((totalSpace - freeSpace) / totalSpace) * 100);
            }
          }
        }
      } else {
        // Ubuntu/Linux: sử dụng df -h để lấy disk usage chính xác
        // df -h / | tail -1 | awk '{print $5}' | sed 's/%//'
        command = "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'";
        const { stdout } = await execAsync(command);
        diskUsage = parseInt(stdout.trim(), 10) || 0;
      }
    } catch (diskError) {
      console.error("Error getting disk space:", diskError);
      diskUsage = 0; // Fallback to 0 if can't get disk info
    }

    // OS Info - lấy thông tin OS từ Ubuntu
    let osInfo = `${os.type()} ${os.release()}`;
    try {
      const platform = os.platform();
      if (platform === "linux") {
        // Ubuntu: lấy thông tin chi tiết từ /etc/os-release
        try {
          const { stdout } = await execAsync("cat /etc/os-release | grep PRETTY_NAME | cut -d '\"' -f 2");
          osInfo = stdout.trim() || osInfo;
        } catch {
          // Fallback: thử lệnh lsb_release nếu có
          try {
            const { stdout } = await execAsync("lsb_release -d | cut -f2");
            osInfo = stdout.trim() || osInfo;
          } catch {
            // Fallback to basic info
          }
        }
      }
    } catch (osError) {
      console.error("Error getting OS info:", osError);
    }

    // Uptime - thời gian đã chạy (tính bằng giây)
    // Ubuntu: có thể dùng uptime command nhưng Node.js os.uptime() đã đủ chính xác
    const uptimeSeconds = Math.floor(os.uptime());
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    return res.json({
      cpu: Math.max(0, Math.min(100, cpuUsage)),
      realMemory: memoryUsage,
      virtualMemory: Math.max(0, Math.min(100, virtualMemoryUsage)),
      localDiskSpace: diskUsage,
      os: osInfo,
      uptime: uptimeFormatted,
      uptimeSeconds: uptimeSeconds,
    });
  } catch (e: any) {
    console.error("Error getting VPS stats:", e);
    // Fallback nếu có lỗi
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsage = Math.round((usedMem / totalMem) * 100);

      return res.json({
        cpu: 0,
        realMemory: memoryUsage,
        virtualMemory: 0,
        localDiskSpace: 0,
        os: `${os.type()} ${os.release()}`,
        uptime: "0d 0h 0m 0s",
        uptimeSeconds: 0,
      });
    } catch (fallbackError) {
      return res.status(500).json({ message: "Lỗi khi lấy thông tin VPS" });
    }
  }
}

// POST /api/admin/vps/restart
export async function restartServer(_req: Request, res: Response) {
  try {
    // Gửi response trước khi restart
    res.json({ message: "Đang khởi động lại server..." });

    // Đợi một chút để response được gửi đi
    setTimeout(() => {
      // Thử dùng PM2 để restart nếu có
      const platform = os.platform();
      if (platform === "linux") {
        // Thử restart bằng PM2
        exec("pm2 restart api", (error) => {
          if (error) {
            console.error("PM2 restart failed, trying process.exit:", error);
            // Fallback: exit process và để PM2 tự restart
            process.exit(0);
          }
        });
      } else {
        // Windows hoặc dev environment: chỉ exit process
        process.exit(0);
      }
    }, 1000);
  } catch (e: any) {
    console.error("Error restarting server:", e);
    return res.status(500).json({ message: "Lỗi khi khởi động lại server" });
  }
}

// GET /api/admin/vps/pm2-logs/:app
export async function getPm2Logs(req: Request, res: Response) {
  try {
    const appName = req.params.app; // 'admin', 'frontend', hoặc 'api'
    const lines = parseInt(String(req.query.lines || "100"), 10); // Số dòng logs, mặc định 100

    // Validate app name
    const validApps = ['admin', 'frontend', 'api'];
    if (!validApps.includes(appName)) {
      return res.status(400).json({ message: "App name không hợp lệ. Chỉ chấp nhận: admin, frontend, api" });
    }

    const platform = os.platform();
    if (platform !== "linux") {
      // Windows hoặc dev environment: trả về logs mẫu hoặc thông báo
      return res.json({
        logs: `[${new Date().toISOString()}] PM2 logs chỉ khả dụng trên Linux server.\nApp: ${appName}\nPlatform: ${platform}`,
        app: appName,
        lines: 0
      });
    }

    // Đọc logs trực tiếp từ log files (PM2 logs command có thể không hoạt động đúng)
    // Dựa vào ecosystem.config.js, logs được lưu tại /opt/websites/logs/
    try {
      const logPaths: Record<string, { out: string; error: string }> = {
        'api': {
          out: '/opt/websites/logs/api-out.log',
          error: '/opt/websites/logs/api-error.log'
        },
        'frontend': {
          out: '/opt/websites/logs/frontend-out.log',
          error: '/opt/websites/logs/frontend-error.log'
        },
        'admin': {
          out: '/opt/websites/logs/admin-out.log',
          error: '/opt/websites/logs/admin-error.log'
        }
      };

      const logPath = logPaths[appName];
      if (!logPath) {
        return res.status(400).json({ message: "App name không hợp lệ" });
      }

      // Đọc log files (lấy N dòng cuối)
      let combinedLogs = '';

      try {
        // Đọc output log (lấy N dòng cuối)
        const { stdout: outLog } = await execAsync(`tail -n ${lines} "${logPath.out}" 2>/dev/null || echo ""`);
        if (outLog && outLog.trim()) {
          combinedLogs += outLog.trim();
        }
      } catch (outError) {
        console.warn(`Could not read output log for ${appName}:`, outError);
      }

      try {
        // Đọc error log (lấy N dòng cuối)
        const { stdout: errorLog } = await execAsync(`tail -n ${lines} "${logPath.error}" 2>/dev/null || echo ""`);
        if (errorLog && errorLog.trim()) {
          if (combinedLogs) {
            combinedLogs += '\n\n--- ERROR LOG ---\n';
          }
          combinedLogs += errorLog.trim();
        }
      } catch (errorError) {
        console.warn(`Could not read error log for ${appName}:`, errorError);
      }

      return res.json({
        logs: combinedLogs || `[${new Date().toISOString()}] Không có logs cho app ${appName}. Log files có thể chưa được tạo hoặc không có quyền đọc.`,
        app: appName,
        lines: lines
      });
    } catch (fileError: any) {
      console.error("Error reading log files:", fileError);
      return res.status(500).json({
        message: `Lỗi khi đọc logs cho app ${appName}`,
        error: fileError.message || String(fileError)
      });
    }
  } catch (e: any) {
    console.error("Error getting PM2 logs:", e);
    return res.status(500).json({ message: "Lỗi khi lấy PM2 logs" });
  }
}



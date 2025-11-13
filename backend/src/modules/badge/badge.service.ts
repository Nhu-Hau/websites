// backend/src/services/badge.service.ts
import { Types } from "mongoose";
import { Badge, BadgeType } from "../../shared/models/Badge";
import { User } from "../../shared/models/User";
import { PracticeAttempt } from "../../shared/models/PracticeAttempt";
import { ProgressAttempt } from "../../shared/models/ProgressAttempt";
import { PlacementAttempt } from "../../shared/models/PlacementAttempt";

export interface BadgeCheckResult {
  earned: boolean;
  badgeType: BadgeType;
  metadata?: Record<string, any>;
}

/**
 * Kiểm tra và cấp badge "Học liên tiếp 7 ngày"
 */
async function checkStreakBadge(
  userId: Types.ObjectId,
  days: number = 7
): Promise<BadgeCheckResult | null> {
  const badgeType: BadgeType = days === 7 ? "streak_7_days" : "streak_30_days";

  // Kiểm tra xem đã có badge chưa
  const existing = await Badge.findOne({ userId, badgeType });
  if (existing) return null;

  // Lấy tất cả attempts (practice, progress, placement) của user
  const [practiceAttempts, progressAttempts, placementAttempts] = await Promise.all([
    PracticeAttempt.find({ userId })
      .select("submittedAt createdAt")
      .sort({ submittedAt: -1 })
      .lean(),
    ProgressAttempt.find({ userId })
      .select("submittedAt createdAt")
      .sort({ submittedAt: -1 })
      .lean(),
    PlacementAttempt.find({ userId })
      .select("submittedAt createdAt")
      .sort({ submittedAt: -1 })
      .lean(),
  ]);

  // Gộp tất cả attempts và lấy ngày duy nhất
  const allDates = new Set<string>();
  [...practiceAttempts, ...progressAttempts, ...placementAttempts].forEach((attempt) => {
    const date = attempt.submittedAt || attempt.createdAt;
    if (date) {
      const dateStr = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
      allDates.add(dateStr);
    }
  });

  // Sắp xếp dates và kiểm tra streak
  const sortedDates = Array.from(allDates)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDates.length === 0) return null;

  // Kiểm tra streak từ ngày gần nhất
  let currentStreak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Bắt đầu từ ngày gần nhất
  let lastDate = new Date(sortedDates[0]);
  lastDate.setHours(0, 0, 0, 0);

  // Nếu ngày gần nhất không phải hôm nay hoặc hôm qua, không có streak
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 1) return null;

  // Đếm streak liên tiếp (bắt đầu từ ngày gần nhất, đếm ngược về quá khứ)
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    currentDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      // Ngày liên tiếp
      currentStreak++;
      lastDate = currentDate;
    } else if (diff > 1) {
      // Có khoảng trống, dừng streak
      break;
    }
    // diff === 0: cùng ngày, bỏ qua
  }

  if (currentStreak >= days) {
    return {
      earned: true,
      badgeType,
      metadata: { streak: currentStreak },
    };
  }

  return null;
}

/**
 * Kiểm tra và cấp badge "Hoàn thành 10 bài Practice Test"
 */
async function checkPractice10TestsBadge(
  userId: Types.ObjectId
): Promise<BadgeCheckResult | null> {
  const badgeType: BadgeType = "practice_10_tests";

  const existing = await Badge.findOne({ userId, badgeType });
  if (existing) return null;

  const count = await PracticeAttempt.countDocuments({ userId });
  if (count >= 10) {
    return {
      earned: true,
      badgeType,
      metadata: { count },
    };
  }

  return null;
}

/**
 * Kiểm tra và cấp badge "Đạt tiến độ mục tiêu TOEIC trên 50%"
 */
async function checkGoal50PercentBadge(
  userId: Types.ObjectId
): Promise<BadgeCheckResult | null> {
  const badgeType: BadgeType = "goal_50_percent";

  const existing = await Badge.findOne({ userId, badgeType });
  if (existing) return null;

  const user = await User.findById(userId).select("toeicGoal toeicPred").lean();
  if (!user || Array.isArray(user)) return null;
  
  const goal = user.toeicGoal;
  const currentScore = user.toeicPred?.overall ?? null;

  if (!goal || goal.targetScore === null || goal.startScore === null || currentScore === null) {
    return null;
  }

  const diff = goal.targetScore - goal.startScore;
  if (diff <= 0) return null;

  const progress = ((currentScore - goal.startScore) / diff) * 100;
  if (progress >= 50) {
    return {
      earned: true,
      badgeType,
      metadata: {
        progress: Math.round(progress * 10) / 10,
        currentScore,
        targetScore: goal.targetScore,
        startScore: goal.startScore,
      },
    };
  }

  return null;
}

/**
 * Kiểm tra và cấp badge "Cải thiện điểm một Part nào đó trên 20 điểm"
 */
async function checkPartImprovementBadge(
  userId: Types.ObjectId
): Promise<BadgeCheckResult | null> {
  const badgeType: BadgeType = "part_improvement_20";

  const existing = await Badge.findOne({ userId, badgeType });
  if (existing) return null;

  // Lấy 2 attempts gần nhất của mỗi part từ ProgressAttempt
  const recentAttempts = await ProgressAttempt.find({ userId })
    .select("partStats submittedAt")
    .sort({ submittedAt: -1 })
    .limit(20)
    .lean();

  if (recentAttempts.length < 2) return null;

  // Nhóm theo part và tìm cải thiện
  const partScores: Record<string, number[]> = {};

  recentAttempts.forEach((attempt) => {
    if (!attempt.partStats) return;
    Object.entries(attempt.partStats).forEach(([partKey, stats]: [string, any]) => {
      if (!stats || typeof stats.acc !== "number") return;
      // Chuyển accuracy thành điểm TOEIC (ước lượng)
      // Accuracy 0.5 -> ~495, 1.0 -> ~990
      const estimatedScore = Math.round(495 + stats.acc * 495);
      if (!partScores[partKey]) {
        partScores[partKey] = [];
      }
      partScores[partKey].push(estimatedScore);
    });
  });

  // Kiểm tra từng part xem có cải thiện >= 20 điểm không
  for (const [partKey, scores] of Object.entries(partScores)) {
    if (scores.length < 2) continue;

    // Lấy điểm cao nhất và điểm thấp nhất (hoặc 2 điểm gần nhất)
    const sortedScores = [...scores].sort((a, b) => b - a);
    const latest = sortedScores[0];
    const previous = sortedScores[1];

    const improvement = latest - previous;
    if (improvement >= 20) {
      return {
        earned: true,
        badgeType,
        metadata: {
          partKey,
          previousScore: previous,
          newScore: latest,
          improvement,
        },
      };
    }
  }

  return null;
}

/**
 * Kiểm tra và cấp badge "First" badges
 */
async function checkFirstBadges(userId: Types.ObjectId): Promise<BadgeCheckResult[]> {
  const results: BadgeCheckResult[] = [];

  // First Placement
  const firstPlacement = await Badge.findOne({ userId, badgeType: "first_placement" });
  if (!firstPlacement) {
    const placementCount = await PlacementAttempt.countDocuments({ userId });
    if (placementCount > 0) {
      results.push({
        earned: true,
        badgeType: "first_placement",
      });
    }
  }

  // First Progress
  const firstProgress = await Badge.findOne({ userId, badgeType: "first_progress" });
  if (!firstProgress) {
    const progressCount = await ProgressAttempt.countDocuments({ userId });
    if (progressCount > 0) {
      results.push({
        earned: true,
        badgeType: "first_progress",
      });
    }
  }

  // First Practice
  const firstPractice = await Badge.findOne({ userId, badgeType: "first_practice" });
  if (!firstPractice) {
    const practiceCount = await PracticeAttempt.countDocuments({ userId });
    if (practiceCount > 0) {
      results.push({
        earned: true,
        badgeType: "first_practice",
      });
    }
  }

  return results;
}

/**
 * Kiểm tra badge "Perfect Score" - đạt 100% trong một bài test
 */
async function checkPerfectScoreBadge(userId: Types.ObjectId): Promise<BadgeCheckResult | null> {
  const existing = await Badge.findOne({ userId, badgeType: "perfect_score" });
  if (existing) return null;

  // Kiểm tra practice attempts
  const perfectPractice = await PracticeAttempt.findOne({
    userId,
    acc: 100,
  }).lean();

  if (perfectPractice) {
    return {
      earned: true,
      badgeType: "perfect_score",
      metadata: { testType: "practice", attemptId: String(perfectPractice._id) },
    };
  }

  // Kiểm tra progress attempts
  const perfectProgress = await ProgressAttempt.findOne({
    userId,
    acc: 100,
  }).lean();

  if (perfectProgress) {
    return {
      earned: true,
      badgeType: "perfect_score",
      metadata: { testType: "progress", attemptId: String(perfectProgress._id) },
    };
  }

  return null;
}

/**
 * Kiểm tra badge "Early Bird" - học trước 7h sáng
 */
async function checkEarlyBirdBadge(userId: Types.ObjectId): Promise<BadgeCheckResult | null> {
  const existing = await Badge.findOne({ userId, badgeType: "early_bird" });
  if (existing) return null;

  // Kiểm tra attempts trong 30 ngày qua
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [practiceAttempts, progressAttempts] = await Promise.all([
    PracticeAttempt.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("createdAt")
      .lean(),
    ProgressAttempt.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("createdAt")
      .lean(),
  ]);

  const allAttempts = [...practiceAttempts, ...progressAttempts];
  for (const attempt of allAttempts) {
    const date = new Date(attempt.createdAt);
    const hour = date.getHours();
    if (hour < 7) {
      return {
        earned: true,
        badgeType: "early_bird",
        metadata: { hour, date: date.toISOString() },
      };
    }
  }

  return null;
}

/**
 * Kiểm tra badge "Night Owl" - học sau 22h tối
 */
async function checkNightOwlBadge(userId: Types.ObjectId): Promise<BadgeCheckResult | null> {
  const existing = await Badge.findOne({ userId, badgeType: "night_owl" });
  if (existing) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [practiceAttempts, progressAttempts] = await Promise.all([
    PracticeAttempt.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("createdAt")
      .lean(),
    ProgressAttempt.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("createdAt")
      .lean(),
  ]);

  const allAttempts = [...practiceAttempts, ...progressAttempts];
  for (const attempt of allAttempts) {
    const date = new Date(attempt.createdAt);
    const hour = date.getHours();
    if (hour >= 22) {
      return {
        earned: true,
        badgeType: "night_owl",
        metadata: { hour, date: date.toISOString() },
      };
    }
  }

  return null;
}

/**
 * Kiểm tra badge "Marathon" - hoàn thành 5+ bài test trong một ngày
 */
async function checkMarathonBadge(userId: Types.ObjectId): Promise<BadgeCheckResult | null> {
  const existing = await Badge.findOne({ userId, badgeType: "marathon" });
  if (existing) return null;

  // Kiểm tra trong 30 ngày qua
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [practiceAttempts, progressAttempts] = await Promise.all([
    PracticeAttempt.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("createdAt")
      .lean(),
    ProgressAttempt.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("createdAt")
      .lean(),
  ]);

  // Nhóm theo ngày
  const attemptsByDate = new Map<string, number>();
  [...practiceAttempts, ...progressAttempts].forEach((attempt) => {
    const date = new Date(attempt.createdAt);
    const dateStr = date.toISOString().split("T")[0];
    attemptsByDate.set(dateStr, (attemptsByDate.get(dateStr) || 0) + 1);
  });

  // Tìm ngày có >= 5 attempts
  for (const [dateStr, count] of attemptsByDate.entries()) {
    if (count >= 5) {
      return {
        earned: true,
        badgeType: "marathon",
        metadata: { date: dateStr, count },
      };
    }
  }

  return null;
}

/**
 * Kiểm tra badge "Consistency King" - học đều đặn trong 14 ngày
 */
async function checkConsistencyKingBadge(userId: Types.ObjectId): Promise<BadgeCheckResult | null> {
  const existing = await Badge.findOne({ userId, badgeType: "consistency_king" });
  if (existing) return null;

  // Lấy attempts trong 14 ngày qua
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [practiceAttempts, progressAttempts, placementAttempts] = await Promise.all([
    PracticeAttempt.find({
      userId,
      createdAt: { $gte: fourteenDaysAgo },
    })
      .select("createdAt submittedAt")
      .lean(),
    ProgressAttempt.find({
      userId,
      createdAt: { $gte: fourteenDaysAgo },
    })
      .select("createdAt submittedAt")
      .lean(),
    PlacementAttempt.find({
      userId,
      createdAt: { $gte: fourteenDaysAgo },
    })
      .select("createdAt submittedAt")
      .lean(),
  ]);

  // Lấy các ngày có học
  const studyDates = new Set<string>();
  [...practiceAttempts, ...progressAttempts, ...placementAttempts].forEach((attempt) => {
    const date = attempt.submittedAt || attempt.createdAt;
    if (date) {
      const dateStr = new Date(date).toISOString().split("T")[0];
      studyDates.add(dateStr);
    }
  });

  // Kiểm tra có >= 12 ngày học trong 14 ngày (85% consistency)
  if (studyDates.size >= 12) {
    return {
      earned: true,
      badgeType: "consistency_king",
      metadata: { days: studyDates.size, totalDays: 14 },
    };
  }

  return null;
}

/**
 * Kiểm tra tất cả badges và cấp badges mới
 * @returns Danh sách badges mới được cấp
 */
export async function checkAndAwardBadges(
  userId: Types.ObjectId
): Promise<BadgeType[]> {
  const newBadges: BadgeType[] = [];

  // Kiểm tra các badges
  const checks = await Promise.all([
    checkStreakBadge(userId, 7),
    checkStreakBadge(userId, 30),
    checkPractice10TestsBadge(userId),
    checkGoal50PercentBadge(userId),
    checkPartImprovementBadge(userId),
    checkFirstBadges(userId),
    checkPerfectScoreBadge(userId),
    checkEarlyBirdBadge(userId),
    checkNightOwlBadge(userId),
    checkMarathonBadge(userId),
    checkConsistencyKingBadge(userId),
  ]);

  // Xử lý kết quả
  const flatResults: BadgeCheckResult[] = [];
  checks.forEach((result) => {
    if (Array.isArray(result)) {
      flatResults.push(...result);
    } else if (result) {
      flatResults.push(result);
    }
  });

  // Lưu badges mới
  for (const result of flatResults) {
    if (result.earned) {
      try {
        await Badge.create({
          userId,
          badgeType: result.badgeType,
          metadata: result.metadata || {},
        });
        newBadges.push(result.badgeType);
      } catch (error: any) {
        // Ignore duplicate key error
        if (error.code !== 11000) {
          console.error(`[BadgeService] Error awarding badge ${result.badgeType}:`, error);
        }
      }
    }
  }

  return newBadges;
}

/**
 * Lấy danh sách badges của user
 */
export async function getUserBadges(userId: Types.ObjectId) {
  return await Badge.find({ userId })
    .sort({ earnedAt: -1 })
    .lean();
}


// backend/src/services/study-schedule.service.ts
import { Types } from "mongoose";
import { StudySchedule, StudyPlan, StudyStatus, Recurrence } from "../../shared/models/StudySchedule";
import { User } from "../../shared/models/User";

/**
 * Tạo hoặc cập nhật lịch học
 * @param userId - ID của user
 * @param startLocal - Thời gian bắt đầu (local time string, có thể là "HH:MM" hoặc "YYYY-MM-DDTHH:mm")
 * @param durationMin - Thời lượng (15, 20, 30, 45, 60, 90 phút)
 * @param plan - Loại buổi học
 * @param options - Các tùy chọn: remindMinutes, notifyEmail, notifyWeb, recurrence
 */
export async function createOrUpdateSchedule(
  userId: string,
  startLocal: string,
  durationMin: number,
  plan: StudyPlan,
  options?: {
    remindMinutes?: number;
    notifyEmail?: boolean;
    notifyWeb?: boolean;
    recurrence?: Recurrence;
  }
) {
  let startAt: Date;
  
  // Parse startLocal: có thể là "HH:MM" hoặc "YYYY-MM-DDTHH:mm"
  if (startLocal.includes("T")) {
    // Format: "YYYY-MM-DDTHH:mm"
    startAt = new Date(startLocal);
    if (isNaN(startAt.getTime())) {
      throw new Error("Invalid date format. Expected YYYY-MM-DDTHH:mm");
    }
  } else {
    // Format: "HH:MM" - mặc định là ngày mai
    const [hours, minutes] = startLocal.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error("Invalid time format. Expected HH:MM");
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    startAt = tomorrow;
  }

  // Tính ngày của lịch (start và end)
  const targetDate = new Date(startAt);
  const targetStart = new Date(targetDate);
  targetStart.setHours(0, 0, 0, 0);
  const targetEnd = new Date(targetDate);
  targetEnd.setHours(23, 59, 59, 999);

  // Kiểm tra xem đã có lịch cho ngày này chưa
  const existing = await StudySchedule.findOne({
    userId: new Types.ObjectId(userId),
    startAt: {
      $gte: targetStart,
      $lte: targetEnd,
    },
    status: { $in: ["scheduled", "reminded"] },
  });

  if (existing) {
    // Cập nhật lịch hiện có
    existing.startAt = startAt;
    existing.durationMin = durationMin;
    existing.plan = plan;
    existing.status = "scheduled";
    existing.remindSent = false;
    if (options?.remindMinutes !== undefined) existing.remindMinutes = options.remindMinutes;
    if (options?.notifyEmail !== undefined) existing.notifyEmail = options.notifyEmail;
    if (options?.notifyWeb !== undefined) existing.notifyWeb = options.notifyWeb;
    if (options?.recurrence !== undefined) existing.recurrence = options.recurrence as any;
    await existing.save();
    return existing;
  }

  // Tính streak: lấy lịch gần nhất đã completed
  const lastCompleted = await StudySchedule.findOne({
    userId: new Types.ObjectId(userId),
    status: "completed",
  })
    .sort({ startAt: -1 })
    .lean();

  let streak = 1; // Mặc định là 1
  if (lastCompleted) {
    const lastDate = new Date(lastCompleted.startAt);
    lastDate.setHours(0, 0, 0, 0);
    const targetDateOnly = new Date(targetDate);
    targetDateOnly.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (targetDateOnly.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff === 1) {
      // Liên tiếp
      streak = (lastCompleted.streak || 0) + 1;
    } else {
      streak = 1; // Bắt đầu lại
    }
  }

  // Tạo lịch mới
  const schedule = await StudySchedule.create({
    userId: new Types.ObjectId(userId),
    startAt,
    durationMin,
    plan,
    status: "scheduled",
    remindSent: false,
    lastNotifiedAt: null,
    streak,
    remindMinutes: options?.remindMinutes ?? 10,
    notifyEmail: options?.notifyEmail ?? true,
    notifyWeb: options?.notifyWeb ?? true,
    recurrence: options?.recurrence as any,
  });

  return schedule;
}

/**
 * Lấy lịch sắp tới của user
 */
export async function getUpcomingSchedule(userId: string) {
  const now = new Date();
  const schedule = await StudySchedule.findOne({
    userId: new Types.ObjectId(userId),
    startAt: { $gte: now },
    status: { $in: ["scheduled", "reminded"] },
  })
    .sort({ startAt: 1 })
    .lean();

  return schedule;
}

/**
 * Cập nhật status của lịch
 */
export async function updateScheduleStatus(
  scheduleId: string,
  userId: string,
  status: StudyStatus
) {
  const schedule = await StudySchedule.findOne({
    _id: new Types.ObjectId(scheduleId),
    userId: new Types.ObjectId(userId),
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  schedule.status = status;
  await schedule.save();
  return schedule;
}

/**
 * Lấy danh sách lịch cần nhắc nhở (dựa trên remindMinutes của từng lịch)
 */
export async function getSchedulesToRemind() {
  const now = new Date();
  
  // Lấy tất cả lịch scheduled/reminded chưa gửi nhắc nhở
  const schedules = await StudySchedule.find({
    status: { $in: ["scheduled", "reminded"] },
    startAt: { $gte: now },
    remindSent: false,
  })
    .populate("userId", "name email")
    .lean();

  // Lọc các lịch cần nhắc nhở dựa trên remindMinutes
  const schedulesToRemind = schedules.filter((schedule) => {
    const remindMinutes = schedule.remindMinutes || 10;
    const remindTime = new Date(schedule.startAt.getTime() - remindMinutes * 60 * 1000);
    return now >= remindTime && now <= new Date(schedule.startAt);
  });

  return schedulesToRemind;
}

/**
 * Đánh dấu missed cho các lịch chưa completed của ngày hôm qua
 */
export async function markMissedSchedules() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const result = await StudySchedule.updateMany(
    {
      startAt: {
        $gte: yesterday,
        $lte: endOfYesterday,
      },
      status: { $in: ["scheduled", "reminded"] },
    },
    {
      $set: { status: "missed" },
    }
  );

  // Lấy danh sách các lịch đã bị missed để gửi email
  const missedSchedules = await StudySchedule.find({
    startAt: {
      $gte: yesterday,
      $lte: endOfYesterday,
    },
    status: "missed",
  })
    .populate("userId", "name email")
    .lean();

  return { count: result.modifiedCount, schedules: missedSchedules };
}


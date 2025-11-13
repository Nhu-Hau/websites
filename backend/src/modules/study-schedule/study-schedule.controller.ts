// backend/src/controllers/study-schedule.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  createOrUpdateSchedule,
  getUpcomingSchedule,
  updateScheduleStatus,
} from "./study-schedule.service";
import { StudySchedule, StudyPlan, StudyStatus } from "../../shared/models/StudySchedule";

/**
 * POST /api/study-schedules
 * Tạo hoặc cập nhật lịch học cho ngày mai
 */
export async function createSchedule(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      startLocal,
      durationMin,
      plan,
      remindMinutes,
      notifyEmail,
      notifyWeb,
      recurrence,
    } = req.body as {
      startLocal?: string;
      durationMin?: number;
      plan?: StudyPlan;
      remindMinutes?: number;
      notifyEmail?: boolean;
      notifyWeb?: boolean;
      recurrence?: any;
    };

    if (!startLocal || !durationMin || !plan) {
      return res.status(400).json({
        message: "startLocal, durationMin, and plan are required",
      });
    }

    if (![15, 20, 30, 45, 60, 90].includes(durationMin)) {
      return res.status(400).json({
        message: "durationMin must be 15, 20, 30, 45, 60, or 90",
      });
    }

    const validPlans = [
      "practice_p1",
      "practice_p2",
      "practice_p3",
      "practice_p4",
      "practice_p5",
      "practice_p6",
      "practice_p7",
      "progress",
      "mini_progress",
      "auto",
    ];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        message: `plan must be one of: ${validPlans.join(", ")}`,
      });
    }

    const schedule = await createOrUpdateSchedule(userId, startLocal, durationMin, plan, {
      remindMinutes,
      notifyEmail,
      notifyWeb,
      recurrence,
    });

    res.json({
      data: {
        _id: schedule._id,
        startAt: schedule.startAt,
        durationMin: schedule.durationMin,
        plan: schedule.plan,
        status: schedule.status,
        streak: schedule.streak,
        remindMinutes: schedule.remindMinutes,
        notifyEmail: schedule.notifyEmail,
        notifyWeb: schedule.notifyWeb,
        recurrence: schedule.recurrence,
      },
    });
  } catch (error: any) {
    console.error("[createSchedule] Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

/**
 * GET /api/study-schedules/upcoming
 * Lấy lịch sắp tới của user
 */
export async function getUpcoming(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const schedule = await getUpcomingSchedule(userId);
    
    if (!schedule) {
      return res.json({ data: null });
    }
    
    if (Array.isArray(schedule)) {
      return res.json({ data: schedule.map((s: any) => ({
        _id: s._id,
        startAt: s.startAt,
        durationMin: s.durationMin,
        plan: s.plan,
        status: s.status,
        streak: s.streak,
      })) });
    }
    
    res.json({
      data: {
        _id: schedule._id,
        startAt: schedule.startAt,
        durationMin: schedule.durationMin,
        plan: schedule.plan,
        status: schedule.status,
        streak: schedule.streak,
        remindMinutes: (schedule as any).remindMinutes,
        notifyEmail: (schedule as any).notifyEmail,
        notifyWeb: (schedule as any).notifyWeb,
        recurrence: (schedule as any).recurrence,
      },
    });
  } catch (error: any) {
    console.error("[getUpcoming] Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

/**
 * PATCH /api/study-schedules/:id
 * Cập nhật lịch (toàn bộ hoặc một phần)
 */
export async function updateSchedule(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData = req.body as any;

    const schedule = await StudySchedule.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Cập nhật các field được phép
    if (updateData.startLocal) {
      let startAt: Date;
      if (updateData.startLocal.includes("T")) {
        startAt = new Date(updateData.startLocal);
      } else {
        const [hours, minutes] = updateData.startLocal.split(":").map(Number);
        const targetDate = new Date(schedule.startAt);
        targetDate.setHours(hours, minutes, 0, 0);
        startAt = targetDate;
      }
      schedule.startAt = startAt;
    }
    if (updateData.durationMin !== undefined) schedule.durationMin = updateData.durationMin;
    if (updateData.plan) schedule.plan = updateData.plan;
    if (updateData.status) schedule.status = updateData.status;
    if (updateData.remindMinutes !== undefined) schedule.remindMinutes = updateData.remindMinutes;
    if (updateData.notifyEmail !== undefined) schedule.notifyEmail = updateData.notifyEmail;
    if (updateData.notifyWeb !== undefined) schedule.notifyWeb = updateData.notifyWeb;
    if (updateData.recurrence !== undefined) schedule.recurrence = updateData.recurrence;

    await schedule.save();

    res.json({
      data: {
        _id: schedule._id,
        startAt: schedule.startAt,
        durationMin: schedule.durationMin,
        plan: schedule.plan,
        status: schedule.status,
        streak: schedule.streak,
        remindMinutes: (schedule as any).remindMinutes,
        notifyEmail: (schedule as any).notifyEmail,
        notifyWeb: (schedule as any).notifyWeb,
        recurrence: (schedule as any).recurrence,
      },
    });
  } catch (error: any) {
    console.error("[updateSchedule] Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

/**
 * PATCH /api/study-schedules/:id/status
 * Cập nhật status của lịch
 */
export async function updateStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status } = req.body as { status?: StudyStatus };

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    if (!["scheduled", "reminded", "completed", "missed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const schedule = await updateScheduleStatus(id, userId, status);

    res.json({
      data: {
        _id: schedule._id,
        startAt: schedule.startAt,
        durationMin: schedule.durationMin,
        plan: schedule.plan,
        status: schedule.status,
        streak: schedule.streak,
        remindMinutes: (schedule as any).remindMinutes,
        notifyEmail: (schedule as any).notifyEmail,
        notifyWeb: (schedule as any).notifyWeb,
        recurrence: (schedule as any).recurrence,
      },
    });
  } catch (error: any) {
    console.error("[updateStatus] Error:", error);
    if (error.message === "Schedule not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

/**
 * DELETE /api/study-schedules/:id
 * Xóa lịch học
 */
export async function deleteSchedule(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const schedule = await StudySchedule.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.json({ message: "Schedule deleted successfully" });
  } catch (error: any) {
    console.error("[deleteSchedule] Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}


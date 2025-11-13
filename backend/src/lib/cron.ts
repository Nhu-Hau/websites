// backend/src/lib/cron.ts
import cron from "node-cron";
import {
  getSchedulesToRemind,
  markMissedSchedules,
} from "../modules/study-schedule/study-schedule.service";
import { sendMail } from "../shared/services/email.service";
import { StudySchedule } from "../shared/models/StudySchedule";
import { Server as SocketIOServer } from "socket.io";
import { Notification } from "../shared/models/Notification";
import { Types } from "mongoose";

function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

/**
 * Gửi email và notification cho lịch học sắp tới
 */
async function sendReminder(schedule: any) {
  // schedule.userId đã được populate, nên có thể là object hoặc ObjectId
  const user = schedule.userId;
  if (!user || (typeof user === "object" && !user.email)) return;
  
  const userEmail = typeof user === "object" ? user.email : null;
  const userName = typeof user === "object" ? user.name : null;
  const userId = typeof user === "object" ? String(user._id) : String(user);
  
  if (!userEmail) return;

  const startAt = new Date(schedule.startAt);
  const hours = startAt.getHours().toString().padStart(2, "0");
  const minutes = startAt.getMinutes().toString().padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;

  const planLabels: Record<string, string> = {
    practice_p3: "Luyện Part 3",
    progress: "Progress Test",
    auto: "Tự động",
  };

  const planLabel = planLabels[schedule.plan] || schedule.plan;

  // Gửi email
  try {
    await sendMail({
      to: userEmail,
      subject: `Nhắc nhở: Buổi học của bạn bắt đầu lúc ${timeStr}`,
      html: `
        <p>Chào ${userName || "bạn"},</p>
        <p>Buổi học của bạn sẽ bắt đầu trong 10 phút nữa!</p>
        <p><strong>Thời gian:</strong> ${timeStr}</p>
        <p><strong>Thời lượng:</strong> ${schedule.durationMin} phút</p>
        <p><strong>Loại:</strong> ${planLabel}</p>
        <p>Hãy chuẩn bị sẵn sàng cho buổi học nhé!</p>
      `,
    });
  } catch (error) {
    console.error(`[Cron] Failed to send email to ${userEmail}:`, error);
  }

  // Tạo notification trong database
  try {
    const notification = await Notification.create({
      userId: new Types.ObjectId(userId),
      type: "system",
      message: `Buổi học của bạn bắt đầu lúc ${timeStr} (${planLabel} - ${schedule.durationMin} phút)`,
      link: "/dashboard",
      meta: {
        scheduleId: schedule._id,
        type: "study_reminder",
      },
    });

    // Gửi qua Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("notify:user", {
        id: String(notification._id),
        type: "system",
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt.toISOString(),
        read: false,
      });

      io.to(`user:${userId}`).emit("corner-toast", {
        id: String(notification._id),
        title: "Nhắc nhở học tập",
        message: notification.message,
        link: notification.link,
      });
    }
  } catch (error) {
    console.error(`[Cron] Failed to create notification:`, error);
  }

  // Đánh dấu đã gửi nhắc nhở
  await StudySchedule.updateOne(
    { _id: schedule._id },
    {
      $set: {
        remindSent: true,
        lastNotifiedAt: new Date(),
        status: "reminded",
      },
    }
  );
}

/**
 * Cron job: Chạy mỗi phút để kiểm tra lịch học sắp tới (≤10 phút)
 */
export function startReminderCron() {
  cron.schedule("* * * * *", async () => {
    try {
      const schedules = await getSchedulesToRemind();
      for (const schedule of schedules) {
        await sendReminder(schedule);
      }
      if (schedules.length > 0) {
        console.log(`[Cron] Sent ${schedules.length} reminder(s)`);
      }
    } catch (error) {
      console.error("[Cron] Error in reminder cron:", error);
    }
  });
  console.log("[Cron] Reminder cron job started (runs every minute)");
}

/**
 * Cron job: Chạy lúc 22:00 mỗi ngày để đánh dấu missed và gửi email
 */
export function startMissedCron() {
  cron.schedule("0 22 * * *", async () => {
    try {
      const { count, schedules } = await markMissedSchedules();
      console.log(`[Cron] Marked ${count} schedule(s) as missed`);

      // Gửi email cho các lịch đã missed
      for (const schedule of schedules) {
        const user = schedule.userId as any;
        if (!user || (typeof user === "object" && !user.email)) continue;
        
        const userEmail = typeof user === "object" ? user.email : null;
        const userName = typeof user === "object" ? user.name : null;
        const userId = typeof user === "object" ? String(user._id) : String(user);
        
        if (!userEmail) continue;

        const startAt = new Date(schedule.startAt);
        const dateStr = startAt.toLocaleDateString("vi-VN");

        try {
          await sendMail({
            to: userEmail,
            subject: "Bạn đã bỏ lỡ buổi học hôm qua",
            html: `
              <p>Chào ${userName || "bạn"},</p>
              <p>Bạn đã bỏ lỡ buổi học đã lên lịch vào ${dateStr}.</p>
              <p>Hãy tiếp tục duy trì thói quen học tập đều đặn nhé!</p>
              <p>Bạn có thể lên lịch học mới trên Dashboard.</p>
            `,
          });
        } catch (error) {
          console.error(`[Cron] Failed to send missed email to ${userEmail}:`, error);
        }

        // Tạo notification
        try {
          const notification = await Notification.create({
            userId: new Types.ObjectId(userId),
            type: "system",
            message: `Bạn đã bỏ lỡ buổi học vào ${dateStr}`,
            link: "/dashboard",
            meta: {
              scheduleId: schedule._id,
              type: "study_missed",
            },
          });

          const io = getIO();
          if (io) {
            io.to(`user:${userId}`).emit("notify:user", {
              id: String(notification._id),
              type: "system",
              message: notification.message,
              link: notification.link,
              createdAt: notification.createdAt.toISOString(),
              read: false,
            });
          }
        } catch (error) {
          console.error(`[Cron] Failed to create missed notification:`, error);
        }
      }
    } catch (error) {
      console.error("[Cron] Error in missed cron:", error);
    }
  });
  console.log("[Cron] Missed schedule cron job started (runs at 22:00 daily)");
}

/**
 * Khởi động tất cả cron jobs
 */
export function startCronJobs() {
  startReminderCron();
  startMissedCron();
}


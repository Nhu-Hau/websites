// backend/src/models/StudySchedule.ts
import { mongoose } from "../../config/database";
import { Schema, Types, Document } from "mongoose";

export type StudyPlan =
  | "practice_p1"
  | "practice_p2"
  | "practice_p3"
  | "practice_p4"
  | "practice_p5"
  | "practice_p6"
  | "practice_p7"
  | "progress"
  | "mini_progress"
  | "auto";
export type StudyStatus = "scheduled" | "reminded" | "completed" | "missed" | "cancelled";

export interface Recurrence {
  mode: "once" | "daily" | "weekdays" | "custom";
  days?: number[]; // 0=Sun..6=Sat (for custom)
}

export interface IStudySchedule extends Document {
  userId: Types.ObjectId;
  startAt: Date; // Thời điểm bắt đầu học (UTC)
  durationMin: number; // Thời lượng học (phút): 15, 20, 30, 45, 60, 90
  plan: StudyPlan; // Loại buổi học
  status: StudyStatus; // Trạng thái
  remindSent: boolean; // Đã gửi nhắc nhở chưa
  lastNotifiedAt: Date | null; // Thời điểm gửi thông báo gần nhất
  streak: number; // Số ngày học liên tiếp (tính từ lịch này)
  remindMinutes?: number; // Nhắc trước bao nhiêu phút (5, 10, 15, 30)
  notifyEmail?: boolean; // Gửi email nhắc nhở
  notifyWeb?: boolean; // Gửi web notification
  recurrence?: Recurrence; // Lặp lịch
}

const StudyScheduleSchema = new Schema<IStudySchedule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationMin: {
      type: Number,
      required: true,
      enum: [15, 20, 30, 45, 60, 90],
    },
    plan: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    remindMinutes: {
      type: Number,
      enum: [5, 10, 15, 30],
      default: 10,
    },
    notifyEmail: {
      type: Boolean,
      default: true,
    },
    notifyWeb: {
      type: Boolean,
      default: true,
    },
    recurrence: {
      type: Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["scheduled", "reminded", "completed", "missed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    remindSent: {
      type: Boolean,
      default: false,
    },
    lastNotifiedAt: {
      type: Date,
      default: null,
    },
    streak: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "study_schedules",
  }
);

// Index để tìm lịch của user và lịch sắp tới
StudyScheduleSchema.index({ userId: 1, startAt: -1 });
StudyScheduleSchema.index({ userId: 1, status: 1, startAt: 1 });
StudyScheduleSchema.index({ status: 1, startAt: 1 }); // Cho cron job

export const StudySchedule =
  mongoose.models.StudySchedule ||
  mongoose.model<IStudySchedule>("StudySchedule", StudyScheduleSchema, "study_schedules");


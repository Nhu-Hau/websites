// backend/src/models/Badge.ts
import { mongoose } from "../../config/database";
import { Schema, Types, Document } from "mongoose";

export type BadgeType =
  | "streak_7_days" // Học liên tiếp 7 ngày
  | "streak_14_days" // Học liên tiếp 14 ngày
  | "streak_30_days" // Học liên tiếp 30 ngày
  | "practice_10_tests" // Hoàn thành 10 bài Practice Test
  | "practice_25_tests" // Hoàn thành 25 bài Practice Test
  | "practice_50_tests" // Hoàn thành 50 bài Practice Test
  | "goal_50_percent" // Đạt tiến độ mục tiêu TOEIC trên 50%
  | "goal_75_percent" // Đạt tiến độ mục tiêu TOEIC trên 75%
  | "goal_100_percent" // Đạt 100% mục tiêu
  | "progress_5_tests" // Hoàn thành 5 Progress Test
  | "part_improvement_20" // Cải thiện điểm một Part nào đó trên 20 điểm
  | "first_placement" // Làm bài Placement Test lần đầu
  | "first_progress" // Làm bài Progress Test lần đầu
  | "first_practice" // Làm bài Practice lần đầu
  | "perfect_score" // Đạt điểm tối đa (100%) trong một bài test
  | "early_bird" // Học vào buổi sáng sớm (trước 7h)
  | "night_owl" // Học vào buổi tối muộn (sau 22h)
  | "marathon" // Hoàn thành 5+ bài test trong một ngày
  | "consistency_king" // Học đều đặn trong 14 ngày
  | "weekend_warrior"; // Học tích cực vào cuối tuần

export interface IBadge extends Document {
  userId: Types.ObjectId;
  badgeType: BadgeType;
  earnedAt: Date;
  metadata?: {
    partKey?: string; // Cho part_improvement_20
    previousScore?: number;
    newScore?: number;
    improvement?: number;
    [key: string]: any;
  };
}

const BadgeSchema = new Schema<IBadge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badgeType: {
      type: String,
      enum: [
        "streak_7_days",
        "streak_14_days",
        "streak_30_days",
        "practice_10_tests",
        "practice_25_tests",
        "practice_50_tests",
        "goal_50_percent",
        "goal_75_percent",
        "goal_100_percent",
        "progress_5_tests",
        "part_improvement_20",
        "first_placement",
        "first_progress",
        "first_practice",
        "perfect_score",
        "early_bird",
        "night_owl",
        "marathon",
        "consistency_king",
        "weekend_warrior",
      ],
      required: true,
    },
    earnedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "badges",
  }
);

// Index để tìm badges của user và kiểm tra duplicate
BadgeSchema.index({ userId: 1, badgeType: 1 }, { unique: true });
BadgeSchema.index({ userId: 1, earnedAt: -1 });

export const Badge =
  mongoose.models.Badge || mongoose.model<IBadge>("Badge", BadgeSchema, "badges");


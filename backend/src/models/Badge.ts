// backend/src/models/Badge.ts
import { mongoose } from "../lib/mongoose";
import { Schema, Types, Document } from "mongoose";

export type BadgeType =
  | "streak_7_days" // Học liên tiếp 7 ngày
  | "practice_10_tests" // Hoàn thành 10 bài Practice Test
  | "goal_50_percent" // Đạt tiến độ mục tiêu TOEIC trên 50%
  | "part_improvement_20" // Cải thiện điểm một Part nào đó trên 20 điểm
  | "first_placement" // Làm bài Placement Test lần đầu
  | "first_progress" // Làm bài Progress Test lần đầu
  | "first_practice" // Làm bài Practice lần đầu
  | "streak_30_days" // Học liên tiếp 30 ngày (bonus)
  | "perfect_score" // Đạt điểm tối đa (100%) trong một bài test
  | "early_bird" // Học vào buổi sáng sớm (trước 7h)
  | "night_owl" // Học vào buổi tối muộn (sau 22h)
  | "marathon" // Hoàn thành 5+ bài test trong một ngày
  | "consistency_king"; // Học đều đặn trong 14 ngày

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
        "practice_10_tests",
        "goal_50_percent",
        "part_improvement_20",
        "first_placement",
        "first_progress",
        "first_practice",
        "streak_30_days",
        "perfect_score",
        "early_bird",
        "night_owl",
        "marathon",
        "consistency_king",
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


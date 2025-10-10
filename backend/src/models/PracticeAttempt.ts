// src/models/PracticeAttempt.ts
import mongoose, { Schema, Types, Document } from "mongoose";

export interface IPracticeAttempt extends Document {
  userId: Types.ObjectId;
  partKey: string;         // "part.1"..."part.7"
  level: 1 | 2 | 3 | 4;
  total: number;
  correct: number;
  acc: number;
  timeSec: number;
  // lưu nhẹ map đáp án đúng để hiển thị lại sau
  answersMap: Record<string, { correctAnswer: string }>;
  submittedAt: Date;
}

const PracticeAttemptSchema = new Schema<IPracticeAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    partKey: { type: String, required: true, index: true },
    level: { type: Number, enum: [1, 2, 3, 4], required: true },
    total: { type: Number, required: true },
    correct: { type: Number, required: true },
    acc: { type: Number, required: true },
    timeSec: { type: Number, default: 0 },
    answersMap: { type: Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

// index gợi ý để query lịch sử nhanh
PracticeAttemptSchema.index({ userId: 1, submittedAt: -1 });

// ép collection name = "practiceattempts"
export const PracticeAttempt =
  mongoose.models.PracticeAttempt ||
  mongoose.model<IPracticeAttempt>("PracticeAttempt", PracticeAttemptSchema, "practiceattempts");
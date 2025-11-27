// backend/src/models/PracticeAttempt.ts
import { mongoose } from "../../config/database";
import { Schema, Types, Document } from "mongoose";

export interface IPracticeAttempt extends Document {
  userId: Types.ObjectId;
  partKey: string;
  level: 1 | 2 | 3;
  test?: number | null;
  total: number;
  correct: number;
  acc: number;
  timeSec: number;
  answersMap: Record<string, { correctAnswer: string; tags?: string[] }>;
  userAnswers: Record<string, string | null>;
  submittedAt: Date;
  isRetake: boolean;
}

const PracticeAttemptSchema = new Schema<IPracticeAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    partKey: { type: String, required: true, index: true },
    level: { type: Number, enum: [1, 2, 3], required: true },
    test: { type: Number, default: null },
    total: { type: Number, required: true },
    correct: { type: Number, required: true },
    acc: { type: Number, required: true },
    timeSec: { type: Number, default: 0 },
    answersMap: { type: Schema.Types.Mixed, default: {} },
    userAnswers: { type: Schema.Types.Mixed, default: {} },
    submittedAt: { type: Date, default: Date.now },
    isRetake: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "practiceattempts",
    minimize: false,
  }
);

PracticeAttemptSchema.index({ userId: 1, partKey: 1, level: 1, test: 1, createdAt: -1 });

export const PracticeAttempt =
  mongoose.models.PracticeAttempt ||
  mongoose.model("PracticeAttempt", PracticeAttemptSchema, "practiceattempts");
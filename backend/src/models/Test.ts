// src/models/ToeicTest.ts
import { Schema, model, models, Model } from "mongoose";

export interface IToeicTest {
  testId: string;
  title: string;
  totalDurationMin: number;
  totalQuestions: number;
  access: "free" | "pro";
  isFeatured?: boolean;
  version?: string;
  sections: Array<{
    name: string;
    durationMin: number;
    parts: Record<string, string[]>;
  }>;
  level: 1 | 2 | 3 | 4;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const toeicTestSchema = new Schema<IToeicTest>(
  {
    testId: { type: String, unique: true, index: true, required: true },
    title: { type: String, required: true },
    totalDurationMin: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    access: { type: String, enum: ["free", "pro"], default: "free" },
    isFeatured: { type: Boolean, default: false },
    version: { type: String, default: "1.0.0" },
    sections: { type: Schema.Types.Mixed, default: [] },
    level: { type: Number, enum: [1, 2, 3, 4], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, collection: "tests" }
);

export const ToeicTest: Model<IToeicTest> =
  (models.ToeicTest as Model<IToeicTest>) ||
  model<IToeicTest>("ToeicTest", toeicTestSchema);

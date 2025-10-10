import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PartKey = "part.1"|"part.2"|"part.3"|"part.4"|"part.5"|"part.6"|"part.7";

export interface ITestItemResult {
  id: string;
  part: PartKey;
  picked: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface ITestAttempt extends Document {
  _id: Types.ObjectId;
  userId: Schema.Types.ObjectId;
  testId: string;
  partKeys: PartKey[];
  total: number;
  correct: number;
  acc: number; // 0..1
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  items: ITestItemResult[];
  timeSec: number;
  startedAt?: Date | null;
  submittedAt: Date;
  version?: string;
  isFull?: boolean;        // có đủ 7 part hay không
  firstLocked?: boolean;   // tương lai: khóa điểm lần 1 khi đủ 7 part
}

const TestAttemptSchema = new Schema<ITestAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  testId: { type: String, required: true, index: true },
  partKeys: { type: [String], default: [] },
  total: Number,
  correct: Number,
  acc: Number,
  listening: { total: Number, correct: Number, acc: Number },
  reading: { total: Number, correct: Number, acc: Number },
  items: [
    {
      id: String,
      part: String,
      picked: { type: String, default: null },
      correctAnswer: String,
      isCorrect: Boolean,
    },
  ],
  timeSec: { type: Number, default: 0 },
  startedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: () => new Date() },
  version: { type: String, default: "1.0.0" },
  isFull: { type: Boolean, default: false },
  firstLocked: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

export const TestAttempt: Model<ITestAttempt> =
  (mongoose.models.TestAttempt as Model<ITestAttempt>) ||
  mongoose.model<ITestAttempt>("TestAttempt", TestAttemptSchema);
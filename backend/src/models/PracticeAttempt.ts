import mongoose, { Schema, Types, Document } from "mongoose";

export type ChoiceId = "A"|"B"|"C"|"D";

export interface IPracticeAttemptItem {
  id: string;
  part: string;                       // "part.1"..."part.7"
  picked: ChoiceId | null;
  correctAnswer: ChoiceId;
  isCorrect: boolean;
}

export interface IPracticeAttempt extends Document {
  userId: Types.ObjectId;
  partKey: string;                    // vd: "part.3"
  levelUsed: 1|2|3|4;
  total: number;
  correct: number;
  acc: number;                        // correct/total
  timeSec: number;
  items: IPracticeAttemptItem[];
  submittedAt: Date;
}

const ItemSchema = new Schema<IPracticeAttemptItem>({
  id: { type: String, required: true },
  part: { type: String, required: true },
  picked: { type: String, default: null },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
}, { _id: false });

const PracticeAttemptSchema = new Schema<IPracticeAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  partKey: { type: String, required: true, index: true },
  levelUsed: { type: Number, enum: [1,2,3,4], required: true },
  total: { type: Number, required: true },
  correct: { type: Number, required: true },
  acc: { type: Number, required: true },
  timeSec: { type: Number, default: 0 },
  items: { type: [ItemSchema], default: [] },
  submittedAt: { type: Date, default: () => new Date() },
}, { timestamps: true, versionKey: false });

PracticeAttemptSchema.index({ userId: 1, submittedAt: -1 });

export const PracticeAttempt =
  mongoose.models.PracticeAttempt || mongoose.model<IPracticeAttempt>("PracticeAttempt", PracticeAttemptSchema);
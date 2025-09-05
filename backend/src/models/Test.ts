import { Schema, model, models } from "mongoose";

const SectionSchema = new Schema(
  {
    totalQuestions: { type: Number, required: true },
    durationMin: { type: Number, required: true }
  },
  { _id: false }
);

const PartSchema = new Schema(
  { questionCount: { type: Number, required: true } },
  { _id: false }
);

const TestSchema = new Schema(
  {
    _id: { type: String, required: true }, // ví dụ: "test-1"
    title: { type: String, required: true },
    access: { type: String, enum: ["free", "pro"], required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true
    },
    durationMin: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    sections: {
      LISTENING: { type: SectionSchema, required: true },
      READING: { type: SectionSchema, required: true }
    },
    parts: {
      // Map<string, PartSchema>
      type: Map,
      of: PartSchema,
      required: true
    },
    version: { type: Number, default: 1 },
    published: { type: Boolean, default: false }
  },
  {
    collection: "toeic_tests", // match tên collection bạn đã import
    timestamps: true
  }
);

export type TestDoc = {
  _id: string;
  title: string;
  access: "free" | "pro";
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMin: number;
  totalQuestions: number;
  sections: {
    LISTENING: { totalQuestions: number; durationMin: number };
    READING: { totalQuestions: number; durationMin: number };
  };
  parts: Map<string, { questionCount: number }>;
  version: number;
  published: boolean;
};

export const Test = models.Test || model<TestDoc>("Test", TestSchema);

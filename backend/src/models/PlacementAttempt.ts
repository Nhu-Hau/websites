import { Schema, Types, Document } from "mongoose";
import { mongoose } from "../lib/mongoose";

mongoose.pluralize(null);

const ItemResultSchema = new Schema(
  {
    id: { type: String, required: true },
    part: { type: String, required: true },
    picked: { type: String, default: null },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const PlacementAttemptSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    total: { type: Number, required: true },
    correct: { type: Number, required: true },
    acc: { type: Number, required: true },
    listening: {
      total: { type: Number, required: true },
      correct: { type: Number, required: true },
      acc: { type: Number, required: true },
    },
    reading: {
      total: { type: Number, required: true },
      correct: { type: Number, required: true },
      acc: { type: Number, required: true },
    },
    level: { type: Number, required: true, enum: [1, 2, 3] },
    items: { type: [ItemResultSchema], default: [] },
    test: { type: Number, default: null, index: true },
    predicted: {
      overall: { type: Number },
      listening: { type: Number },
      reading: { type: Number },
    },
    partStats: { type: Schema.Types.Mixed },
    weakParts: [String],
    allIds: { type: [String], default: [] },
    timeSec: { type: Number, default: 0 },
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
    version: { type: String, default: "1.0.0" },
  },
  {
    timestamps: true,
    collection: "placementattempts",
  }
);

PlacementAttemptSchema.index({ userId: 1, submittedAt: -1 });

export const PlacementAttempt =
  mongoose.models.PlacementAttempt ||
  mongoose.model(
    "PlacementAttempt",
    PlacementAttemptSchema,
    "placementattempts"
  );

if (PlacementAttempt.collection.collectionName !== "placementattempts") {
  throw new Error(
    `PlacementAttempt bound to wrong collection: ${PlacementAttempt.collection.collectionName}`
  );
}

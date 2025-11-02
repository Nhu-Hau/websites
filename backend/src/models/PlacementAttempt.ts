import mongoose, { Schema, Types } from "mongoose";

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
    testId: { type: String, required: true, index: true },
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
  { timestamps: true }
);

PlacementAttemptSchema.index({ userId: 1, submittedAt: -1 });

export default mongoose.model("Placement_Attempt", PlacementAttemptSchema);

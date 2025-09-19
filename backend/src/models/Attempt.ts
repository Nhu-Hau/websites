import { Schema, model, models } from 'mongoose';

const AnswerSchema = new Schema(
  {
    itemId: { type: String, required: true },
    choice: { type: String, enum: ['A','B','C','D'], required: true },
    correct: { type: Boolean, required: true },
    timeSec: { type: Number },
    at: { type: Date, default: () => new Date() }
  },
  { _id: false }
);

const AttemptSchema = new Schema(
  {
    attemptId: { type: String, unique: true, required: true },
    userId: { type: String, index: true, required: true },
    testId: { type: String, index: true, required: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    answers: { type: [AnswerSchema], default: [] }
  },
  { timestamps: true }
);

AttemptSchema.index({ userId: 1, finishedAt: -1 });
AttemptSchema.index({ "answers.itemId": 1 });

export default (models.Attempt as any) || model('Attempt', AttemptSchema);
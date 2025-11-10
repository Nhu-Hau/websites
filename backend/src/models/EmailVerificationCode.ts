import mongoose, { Schema, InferSchemaType } from "mongoose";


const EmailVerificationCodeSchema = new Schema({
  email: { type: String, index: true, required: true },
  codeHash: { type: String, required: true },
  used: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, required: true, index: true },
  lastSentAt: { type: Date, default: () => new Date() },
  resendCount: { type: Number, default: 0 },
});

EmailVerificationCodeSchema.index({ email: 1, used: 1, expiresAt: 1 });

export type IEmailVerificationCode = InferSchemaType<typeof EmailVerificationCodeSchema>;

export const EmailVerificationCodeModel =
  mongoose.models.EmailVerificationCode ||
  mongoose.model<IEmailVerificationCode>(
    "EmailVerificationCode",
    EmailVerificationCodeSchema
  );

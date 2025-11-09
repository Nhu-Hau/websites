import mongoose, { Schema, Document } from "mongoose";

export interface IEmailVerificationCode extends Document {
  email: string;
  codeHash: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const EmailVerificationCodeSchema = new Schema<IEmailVerificationCode>(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export const EmailVerificationCodeModel =
  mongoose.models.EmailVerificationCode ||
  mongoose.model<IEmailVerificationCode>(
    "EmailVerificationCode",
    EmailVerificationCodeSchema
  );
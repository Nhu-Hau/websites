// src/models/ResetToken.ts
import mongoose from "mongoose";
const ResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  jti: { type: String, unique: true, required: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index tự xoá
});
export const ResetTokenModel = mongoose.model("ResetToken", ResetTokenSchema);
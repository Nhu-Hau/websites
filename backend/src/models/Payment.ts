import mongoose, { Schema, Types, Document } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled";

export interface IPaymentOrder extends Document {
  userId: Types.ObjectId;
  courseSlug?: string | null;     // mua khóa lẻ
  kind: "course" | "premium";
  amount: number;
  currency: "VND";
  memo: string;
  status: PaymentStatus;
  expiresAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseSlug: { type: String, default: null },
    kind: { type: String, enum: ["course", "premium"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ["VND"], default: "VND" },
    memo: { type: String, required: true },
    status: { type: String, enum: ["pending", "paid", "expired", "cancelled"], default: "pending", index: true },
    expiresAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

export const PaymentOrder =
  mongoose.models.PaymentOrder ||
  mongoose.model<IPaymentOrder>("PaymentOrder", PaymentOrderSchema);
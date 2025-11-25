// backend/src/models/Payment.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export type PaymentPlan = "monthly_79" | "monthly_159";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orderCode: number; // PayOS orderCode
  amount: number; // Số tiền (VND)
  description: string;
  status: PaymentStatus;
  payOSTransactionId?: string;
  payOSCheckoutUrl?: string;
  payOSQrCode?: string;
  cancelUrl?: string;
  returnUrl?: string;
  paidAt?: Date;
  promoCode?: string | null;
  amountBefore?: number | null;
  amountAfter?: number | null;
  plan?: PaymentPlan | null; // "monthly_79" (1 tháng) hoặc "monthly_159" (3 tháng)
  premiumExpiryDate?: Date | null; // Ngày hết hạn premium
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    payOSTransactionId: String,
    payOSCheckoutUrl: String,
    payOSQrCode: String,
    cancelUrl: String,
    returnUrl: String,
    paidAt: Date,
    plan: {
      type: String,
      enum: ["monthly_79", "monthly_159"],
      required: false,
    },
    premiumExpiryDate: Date,
  },
  { timestamps: true, versionKey: false }
);

// Index để tìm payment theo userId và status
paymentSchema.index({ userId: 1, status: 1 });

export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

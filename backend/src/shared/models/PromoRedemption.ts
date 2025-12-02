import { Schema, Types, model } from "mongoose";

export interface PromoRedemptionDoc {
  promoCode: string;            // lưu value code để truy vấn nhanh
  userId: Types.ObjectId;
  paymentId: Types.ObjectId;    // payment đã PAID
  amountBefore: number;
  amountAfter: number;
  createdAt: Date;
}

const PromoRedemptionSchema = new Schema<PromoRedemptionDoc>(
  {
    promoCode: { type: String, index: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
    amountBefore: { type: Number, required: true },
    amountAfter: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PromoRedemption = model<PromoRedemptionDoc>(
  "PromoRedemption",
  PromoRedemptionSchema,
  "promoredemptions"
);
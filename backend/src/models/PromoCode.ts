import { Schema, model, Types, Document } from "mongoose";

export type PromoType = "fixed" | "percent";

export interface PromoDoc extends Document {
  code: string;
  type?: PromoType | null; // 'fixed' | 'percent' | null
  value?: number | null; // số tiền giảm hoặc % giảm
  amountAfter?: number | null; // nếu set, giá cuối cùng
  baseAmount?: number | null; // giá gốc (mặc định lấy BASE_PRICE nếu null)

  activeFrom?: Date | null;
  activeTo?: Date | null;

  maxUses?: number | null; // tổng lượt dùng tối đa của mã
  usedCount: number; // đã dùng bao nhiêu (tăng khi thanh toán PAID)
  perUserLimit?: number | null; // số lần 1 user được dùng (đếm PAID)

  allowedUsers?: Types.ObjectId[]; // danh sách user được dùng (nếu có)
  createdAt?: Date;
  updatedAt?: Date;
}

const PromoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    type: { type: String, enum: ["fixed", "percent"], required: false },
    value: { type: Number, required: false },
    amountAfter: { type: Number, required: false },
    baseAmount: { type: Number, required: false },
    activeFrom: { type: Date, required: false },
    activeTo: { type: Date, required: false },
    maxUses: { type: Number, required: false },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, required: false },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// ép collection name = "promocodes" cho chắc
export const PromoCode = model("PromoCode", PromoCodeSchema, "promocodes");

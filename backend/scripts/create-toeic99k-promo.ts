/**
 * Script để tạo mã khuyến mãi TOEIC99K
 * Chạy: npx ts-node backend/scripts/create-toeic99k-promo.ts
 */

import mongoose from "mongoose";
import { PromoCode } from "../src/shared/models/PromoCode";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/toeic-prep";

async function createTOEIC99KPromo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Kiểm tra xem mã đã tồn tại chưa
    const existing = await PromoCode.findOne({ code: "TOEIC99K" });
    if (existing) {
      console.log("⚠️  Mã TOEIC99K đã tồn tại. Xóa và tạo lại...");
      await PromoCode.deleteOne({ code: "TOEIC99K" });
    }

    // Tạo mã mới
    // Mã này giảm gói 159k xuống 99k (giảm 60k)
    const promo = await PromoCode.create({
      code: "TOEIC99K",
      type: "fixed",
      value: 60_000, // Giảm 60k
      baseAmount: 159_000, // Áp dụng cho gói 159k
      amountAfter: 99_000, // Giá sau giảm là 99k
      activeFrom: new Date(), // Có hiệu lực ngay
      activeTo: null, // Không có ngày hết hạn (hoặc set ngày cụ thể nếu cần)
      maxUses: null, // Không giới hạn số lần dùng (hoặc set số cụ thể nếu cần)
      usedCount: 0,
      perUserLimit: 1, // Mỗi user chỉ dùng được 1 lần
      allowedUsers: [], // Không giới hạn user nào
    });

    console.log("✅ Đã tạo mã khuyến mãi TOEIC99K:");
    console.log("   - Code: TOEIC99K");
    console.log("   - Type: fixed");
    console.log("   - Value: 60,000 VND");
    console.log("   - Base Amount: 159,000 VND (gói 3 tháng)");
    console.log("   - Amount After: 99,000 VND");
    console.log("   - Per User Limit: 1 lần");
    console.log("   - Active From: Ngay bây giờ");
    console.log("   - Active To: Không giới hạn");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error: any) {
    console.error("❌ Error:", error?.message || error);
    process.exit(1);
  }
}

createTOEIC99KPromo();


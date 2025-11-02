// backend/src/controllers/payments.webhook.controller.ts
import { Request, Response } from "express";
import { Payment, PaymentStatus } from "../models/Payment";
import { User } from "../models/User";
import { PayOS } from "@payos/node";

// Khởi tạo PayOS client
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "",
  apiKey: process.env.PAYOS_API_KEY || "",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
});

/**
 * POST /api/payments/webhook
 * Webhook handler để nhận thông báo từ PayOS
 * PayOS sẽ gọi endpoint này khi có thay đổi về trạng thái thanh toán
 */
export async function handlePayOSWebhook(req: Request, res: Response) {
  // Trả lời PayOS ngay để tránh timeout (trước khi xử lý logic)
  res.status(200).json({ ok: true });

  try {
    const { data, code, desc } = req.body;

    // Log webhook nhận được (để debug)
    console.log("PayOS webhook received:", { code, desc, data: data ? "present" : "missing" });

    if (code !== "00") {
      console.error("PayOS webhook error:", { code, desc, data });
      return;
    }

    if (!data || !data.orderCode) {
      console.error("PayOS webhook: missing data or orderCode");
      return;
    }

    const { orderCode, transactionDateTime, description, amount } = data;

    // Tìm payment trong database
    const payment = await Payment.findOne({ orderCode });
    if (!payment) {
      console.error(`Payment not found for orderCode: ${orderCode}`);
      return;
    }

    // Kiểm tra nếu đã thanh toán rồi thì không xử lý lại (idempotent)
    if (payment.status === PaymentStatus.PAID) {
      console.log(`Payment ${orderCode} already paid, skipping`);
      return;
    }

    // Verify payment với PayOS API để đảm bảo tính toàn vẹn
    try {
      const paymentLinkInformation = await payOS.paymentRequests.get(orderCode);
      
      if (paymentLinkInformation.status === "PAID") {
        // Cập nhật payment status
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date(transactionDateTime || Date.now());
        // paymentLinkInformation.transactions là array, lấy transaction đầu tiên nếu có
        payment.payOSTransactionId = paymentLinkInformation.transactions?.[0]?.reference || null;
        await payment.save();

        // Nâng cấp user lên premium
        const user = await User.findById(payment.userId);
        if (user && user.access !== "premium") {
          user.access = "premium";
          await user.save();
          console.log(`✅ User ${user.email} (${user._id}) upgraded to premium via payment ${orderCode}`);
        } else if (user) {
          console.log(`⚠️ User ${user.email} already premium, payment ${orderCode} recorded`);
        }
      } else if (paymentLinkInformation.status === "CANCELLED") {
        payment.status = PaymentStatus.CANCELLED;
        await payment.save();
        console.log(`Payment ${orderCode} cancelled`);
      } else if (paymentLinkInformation.status === "EXPIRED") {
        payment.status = PaymentStatus.EXPIRED;
        await payment.save();
        console.log(`Payment ${orderCode} expired`);
      } else {
        console.log(`Payment ${orderCode} status: ${paymentLinkInformation.status}`);
      }
    } catch (verifyError: any) {
      console.error(`Error verifying payment ${orderCode} with PayOS API:`, verifyError.message);
      // Không throw error vì đã trả lời PayOS rồi
    }
  } catch (error: any) {
    console.error("Error handling PayOS webhook:", error);
    // Đã trả lời PayOS rồi, không cần trả lời lại
  }
}


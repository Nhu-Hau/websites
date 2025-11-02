// backend/src/controllers/payments.controller.ts
import { Request, Response, NextFunction } from "express";
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
 * POST /api/payments/create
 * Tạo payment link cho gói Pro
 */
export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Kiểm tra user đã là premium chưa
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.access === "premium") {
      return res.status(400).json({ message: "Bạn đã là thành viên Premium" });
    }

    // Giá gói Pro: 129,000 VND/tháng
    const amount = 10000;
    const description = "Nâng cấp gói Pro"; // PayOS yêu cầu tối đa 25 ký tự

    // Tạo orderCode duy nhất (sử dụng timestamp)
    const orderCode = Date.now();

    // URL callback
    const baseUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:3000";
    // PayOS sẽ redirect về returnUrl với orderCode trong query params
    const returnUrl = `${baseUrl}/payment/success?orderCode=${orderCode}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // Tạo payment link từ PayOS
    const paymentData = {
      orderCode: orderCode,
      amount: amount,
      description: description,
      cancelUrl: cancelUrl,
      returnUrl: returnUrl,
      items: [
        {
          name: "Gói Pro - TOEIC Prep",
          quantity: 1,
          price: amount,
        },
      ],
    };

    const paymentLinkData = await payOS.paymentRequests.create(paymentData);

    // Lưu payment vào database
    const payment = new Payment({
      userId,
      orderCode: orderCode,
      amount,
      description,
      status: PaymentStatus.PENDING,
      payOSCheckoutUrl: paymentLinkData.checkoutUrl,
      payOSQrCode: paymentLinkData.qrCode,
      returnUrl,
      cancelUrl,
    });
    await payment.save();

    res.json({
      data: {
        checkoutUrl: paymentLinkData.checkoutUrl,
        qrCode: paymentLinkData.qrCode,
        orderCode: orderCode,
      },
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    next(error);
  }
}

/**
 * GET /api/payments/status/:orderCode
 * Kiểm tra trạng thái thanh toán
 * Nếu payment chưa được cập nhật, sẽ verify trực tiếp với PayOS API
 */
export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderCode } = req.params;
    const orderCodeNum = parseInt(orderCode);
    
    let payment = await Payment.findOne({ userId, orderCode: orderCodeNum });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Nếu payment chưa có status "paid", verify trực tiếp với PayOS API
    if (payment.status !== PaymentStatus.PAID) {
      try {
        const paymentLinkInformation = await payOS.paymentRequests.get(orderCodeNum);
        
        if (paymentLinkInformation.status === "PAID") {
          // Cập nhật payment status
          payment.status = PaymentStatus.PAID;
          payment.paidAt = new Date();
          payment.payOSTransactionId = paymentLinkInformation.transactions?.[0]?.reference || null;
          await payment.save();

          // Nâng cấp user lên premium
          const user = await User.findById(payment.userId);
          if (user && user.access !== "premium") {
            user.access = "premium";
            await user.save();
            console.log(`✅ User ${user.email} (${user._id}) upgraded to premium via payment ${orderCodeNum}`);
          }
        } else if (paymentLinkInformation.status === "CANCELLED") {
          payment.status = PaymentStatus.CANCELLED;
          await payment.save();
        } else if (paymentLinkInformation.status === "EXPIRED") {
          payment.status = PaymentStatus.EXPIRED;
          await payment.save();
        }
      } catch (verifyError: any) {
        console.error(`Error verifying payment ${orderCodeNum} with PayOS API:`, verifyError.message);
        // Nếu lỗi verify, vẫn trả về status hiện tại từ database
      }
      
      // Reload payment để lấy status mới nhất
      payment = await Payment.findOne({ userId, orderCode: orderCodeNum });
    }

    res.json({
      data: {
        status: payment!.status,
        orderCode: payment!.orderCode,
        amount: payment!.amount,
        paidAt: payment!.paidAt,
      },
    });
  } catch (error: any) {
    next(error);
  }
}


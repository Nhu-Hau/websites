import { Request, Response, NextFunction } from "express";
import { PayOS } from "@payos/node";
import { Payment, PaymentStatus } from "../models/Payment";
import { User } from "../models/User";
import { Types } from "mongoose";
import { PromoCode, PromoDoc } from "../models/PromoCode";
import { PromoRedemption } from "../models/PromoRedemption";

const BASE_PRICE = 129000; // VND

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "",
  apiKey: process.env.PAYOS_API_KEY || "",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
});

function computeDiscountedAmount(opts: {
  baseAmount: number;
  type?: "fixed" | "percent" | null;
  value?: number | null;
  amountAfter?: number | null;
}) {
  const { baseAmount, type, value, amountAfter } = opts;
  if (typeof amountAfter === "number" && amountAfter > 0) {
    return Math.max(1000, Math.round(amountAfter));
  }
  if (!type) return baseAmount;

  if (type === "fixed") {
    const final = baseAmount - (value || 0);
    return Math.max(1000, Math.round(final));
  }
  if (type === "percent") {
    const pct = Math.max(0, Math.min(100, value || 0));
    const final = baseAmount * (1 - pct / 100);
    return Math.max(1000, Math.round(final));
  }
  return baseAmount;
}

async function validatePromoInternal(codeRaw: string, userId: string) {
  const code = String(codeRaw || "").trim().toUpperCase();
  if (!code) return { ok: false as const, message: "Thiếu mã khuyến mãi" };

  // ✅ quan trọng: ép kiểu kết quả bằng generic
  const promo = await PromoCode.findOne({ code }).lean<PromoDoc>().exec();
  if (!promo) return { ok: false as const, message: "Mã không tồn tại" };

  const now = Date.now();
  if (promo.activeFrom && now < new Date(promo.activeFrom).getTime()) {
    return { ok: false as const, message: "Mã chưa tới thời gian áp dụng" };
  }
  if (promo.activeTo && now > new Date(promo.activeTo).getTime()) {
    return { ok: false as const, message: "Mã đã hết hạn" };
  }

  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return { ok: false as const, message: "Mã đã hết lượt sử dụng" };
  }

  if (promo.allowedUsers && promo.allowedUsers.length > 0) {
    const me = new Types.ObjectId(userId);
    const allowed = promo.allowedUsers.some((u) => u.equals(me));
    if (!allowed) {
      return {
        ok: false as const,
        message: "Bạn không nằm trong danh sách áp dụng mã này",
      };
    }
  }

  if (promo.perUserLimit && promo.perUserLimit > 0) {
    const usedByMe = await Payment.countDocuments({
      userId,
      promoCode: promo.code,
      status: PaymentStatus.PAID,
    });
    if (usedByMe >= promo.perUserLimit) {
      return {
        ok: false as const,
        message: "Bạn đã dùng mã này đủ số lần cho phép",
      };
    }
  }

  const baseAmount = promo.baseAmount || BASE_PRICE;
  const amountAfter = computeDiscountedAmount({
    baseAmount,
    type: promo.type ?? null,
    value: promo.value ?? null,
    amountAfter: promo.amountAfter ?? null,
  });

  return {
    ok: true as const,
    data: {
      code: promo.code,
      baseAmount,
      amountAfter,
      type: promo.type,
      value: promo.value ?? undefined,
      activeFrom: promo.activeFrom ?? undefined,
      activeTo: promo.activeTo ?? undefined,
    },
  };
}

/** POST /api/payments/promo/validate */
export async function validatePromo(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { code } = req.body || {};
    const r = await validatePromoInternal(code, String(userId));
    if (!r.ok) return res.status(400).json({ message: r.message });

    return res.json({
      data: {
        code: r.data.code,
        amountBefore: r.data.baseAmount,
        amountAfter: r.data.amountAfter,
        type: r.data.type,
        value: r.data.value,
        activeFrom: r.data.activeFrom,
        activeTo: r.data.activeTo,
      },
    });
  } catch (e: any) {
    console.error("validatePromo error:", e?.message || e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Nâng cấp user */
async function upgradeUserToPremium(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;
  if (user.access !== "premium") {
    user.access = "premium";
    await user.save();
    console.log(`✅ User ${user.email} (${user._id}) upgraded to premium`);
  }
}

/** Đồng bộ trạng thái từ PayOS */
async function syncPaymentFromPayOS(orderCode: number) {
  const info = await payOS.paymentRequests.get(orderCode);
  const payment = await Payment.findOne({ orderCode });
  if (!payment) return null;

  if (info.status === "PAID" && payment.status !== PaymentStatus.PAID) {
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.payOSTransactionId = info.transactions?.[0]?.reference || null;
    await payment.save();

    await upgradeUserToPremium(payment.userId.toString());

    // Lưu redemption nếu có (nếu bạn chưa có model này, comment lại 5 dòng dưới)
    if (payment.promoCode) {
      try {
        await PromoRedemption.create({
          promoCode: payment.promoCode,
          userId: payment.userId,
          paymentId: payment._id,
          amountBefore: payment.amountBefore ?? payment.amount,
          amountAfter: payment.amountAfter ?? payment.amount,
        });
      } catch (e) {
        console.warn("PromoRedemption save failed:", (e as any)?.message || e);
      }
    }
  } else if (info.status === "CANCELLED" && payment.status !== PaymentStatus.CANCELLED) {
    payment.status = PaymentStatus.CANCELLED;
    await payment.save();
  } else if (info.status === "EXPIRED" && payment.status !== PaymentStatus.EXPIRED) {
    payment.status = PaymentStatus.EXPIRED;
    await payment.save();
  }

  return payment;
}

/** POST /api/payments/create */
export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.access === "premium")
      return res.status(400).json({ message: "Bạn đã là thành viên Premium" });

    const { promoCode } = req.body || {};

    const amountBefore = BASE_PRICE;
    let amountAfter = amountBefore;
    let appliedPromo: string | null = null;

    if (promoCode) {
      const vr = await validatePromoInternal(promoCode, String(userId));
      if (!vr.ok) {
        return res.status(400).json({ message: vr.message });
      }
      amountAfter = vr.data.amountAfter;
      appliedPromo = vr.data.code;
    }

    const description = "Nang cap goi Pro";
    const orderCode = Date.now();
    const baseUrl =
      process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/payment/success?orderCode=${orderCode}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    const paymentLinkData = await payOS.paymentRequests.create({
      orderCode,
      amount: amountAfter,
      description,
      cancelUrl,
      returnUrl,
      items: [{ name: "Goi Pro - TOEIC Prep", quantity: 1, price: amountAfter }],
    });

    await new Payment({
      userId,
      orderCode,
      amount: amountAfter,           // số tiền thực trả
      amountBefore,                  // giữ lại giá gốc để đối chiếu
      amountAfter,                   // giá sau giảm
      description,
      status: PaymentStatus.PENDING,
      payOSCheckoutUrl: paymentLinkData.checkoutUrl,
      payOSQrCode: paymentLinkData.qrCode,
      returnUrl,
      cancelUrl,
      promoCode: appliedPromo,       // null nếu không dùng mã
    }).save();

    res.json({
      data: {
        checkoutUrl: paymentLinkData.checkoutUrl,
        qrCode: paymentLinkData.qrCode,
        orderCode,
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    next(error);
  }
}

/** GET /api/payments/status/:orderCode */
export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const orderCode = Number(req.params.orderCode);
    if (Number.isNaN(orderCode))
      return res.status(400).json({ message: "orderCode không hợp lệ" });

    let payment = await Payment.findOne({ userId, orderCode });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status !== PaymentStatus.PAID) {
      try {
        payment = (await syncPaymentFromPayOS(orderCode)) || payment;
      } catch (e: any) {
        console.error(`Verify PayOS failed for ${orderCode}:`, e?.message);
      }
    }

    res.json({
      data: {
        status: payment.status,
        orderCode: payment.orderCode,
        amount: payment.amount,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/** POST /api/payments/webhook */
export async function handlePayOSWebhook(req: Request, res: Response) {
  // Trả lời ngay để PayOS không timeout
  res.status(200).json({ ok: true });

  try {
    // TODO: Verify chữ ký webhook theo docs PayOS
    const body = req.body || {};
    const data = body.data;
    const code = body.code;

    if (code !== "00" || !data?.orderCode) {
      console.error("Invalid PayOS webhook payload:", { code, hasData: !!data });
      return;
    }

    const orderCode: number = Number(data.orderCode);
    if (Number.isNaN(orderCode)) {
      console.error("Webhook with invalid orderCode:", data.orderCode);
      return;
    }

    await syncPaymentFromPayOS(orderCode);
  } catch (error: any) {
    console.error("Error handling PayOS webhook:", error?.message || error);
  }
}
import { Request, Response, NextFunction } from "express";
import { PayOS } from "@payos/node";
import { Payment, PaymentStatus, PaymentPlan } from "../../shared/models/Payment";
import { User } from "../../shared/models/User";
import { Types } from "mongoose";
import { PromoCode, PromoDoc } from "../../shared/models/PromoCode";
import { PromoRedemption } from "../../shared/models/PromoRedemption";

// Giá các gói
const PLAN_PRICES: Record<PaymentPlan, number> = {
  monthly_79: 79_000, // 79k/tháng (1 tháng)
  monthly_159: 159_000, // 159k/3 tháng
};

const PLAN_DURATIONS: Record<PaymentPlan, number> = {
  monthly_79: 1, // 1 tháng
  monthly_159: 3, // 3 tháng
};

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
  if (typeof amountAfter === "number" && amountAfter >= 0) {
    return Math.round(amountAfter);
  }
  if (!type) return baseAmount;

  if (type === "fixed") {
    const final = baseAmount - (value || 0);
    return Math.max(0, Math.round(final));
  }
  if (type === "percent") {
    const pct = Math.max(0, Math.min(100, value || 0));
    const final = baseAmount * (1 - pct / 100);
    return Math.max(0, Math.round(final));
  }
  return baseAmount;
}

function normalizeBaseAmount(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[,_\s]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    if (value instanceof Types.Decimal128) {
      const parsed = Number(value.toString());
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value.valueOf === "function") {
      const raw = value.valueOf();
      if (typeof raw === "number" && Number.isFinite(raw)) {
        return raw;
      }
      if (typeof raw === "string") {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
  }
  return null;
}

async function validatePromoInternal(codeRaw: string, userId: string) {
  const code = String(codeRaw || "")
    .trim()
    .toUpperCase();
  if (!code) return { ok: false as const, message: "Thiếu mã khuyến mãi" };

  // ✅ quan trọng: ép kiểu kết quả bằng generic
  const promo = await PromoCode.findOne({ code }).lean<PromoDoc>().exec();
  if (!promo) return { ok: false as const, message: "Mã không tồn tại" };

  const now = Date.now();

  // Xử lý date an toàn cho cả Date object, string, và object từ .lean()
  const getDateTimestamp = (date: any): number | null => {
    if (!date) return null;

    // Nếu là Date object
    if (date instanceof Date) {
      return date.getTime();
    }

    // Nếu là string, parse thành Date
    if (typeof date === "string") {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed.getTime();
    }

    // Nếu là object (có thể từ .lean()), thử các thuộc tính phổ biến
    if (typeof date === "object") {
      // Mongoose lean() có thể trả về object với thuộc tính $date
      if (date.$date) {
        const parsed = new Date(date.$date);
        return isNaN(parsed.getTime()) ? null : parsed.getTime();
      }
      // Hoặc có thuộc tính toString
      if (typeof date.toString === "function") {
        try {
          const parsed = new Date(date.toString());
          if (!isNaN(parsed.getTime())) return parsed.getTime();
        } catch (e) {
          // ignore
        }
      }
      // Hoặc có thuộc tính valueOf
      if (typeof date.valueOf === "function") {
        try {
          const value = date.valueOf();
          if (typeof value === "number") return value;
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) return parsed.getTime();
        } catch (e) {
          // ignore
        }
      }
    }

    return null;
  };

  const activeFromTime = getDateTimestamp(promo.activeFrom);
  if (activeFromTime !== null && now < activeFromTime) {
    const startDate = new Date(activeFromTime);
    console.log(
      `[Promo Validation] Code: ${code} not yet active. activeFrom: ${promo.activeFrom
      }, startDate: ${startDate.toISOString()}, now: ${new Date(
        now
      ).toISOString()}`
    );
    return {
      ok: false as const,
      message: `Mã chưa tới thời gian áp dụng (bắt đầu: ${startDate.toLocaleDateString(
        "vi-VN"
      )} ${startDate.toLocaleTimeString("vi-VN")})`,
    };
  }

  const activeToTime = getDateTimestamp(promo.activeTo);
  if (activeToTime !== null) {
    const expiredDate = new Date(activeToTime);
    const nowDate = new Date(now);
    console.log(
      `[Promo Validation] Code: ${code} date check. activeTo (raw): ${JSON.stringify(
        promo.activeTo
      )}, activeToTime: ${activeToTime}, expiredDate: ${expiredDate.toISOString()}, now: ${nowDate.toISOString()}, nowTime: ${now}, diff: ${Math.round(
        (now - activeToTime) / (1000 * 60 * 60)
      )} hours`
    );

    if (now > activeToTime) {
      return {
        ok: false as const,
        message: `Mã đã hết hạn (hết hạn: ${expiredDate.toLocaleDateString(
          "vi-VN"
        )} ${expiredDate.toLocaleTimeString("vi-VN")})`,
      };
    }
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
    // if (usedByMe >= promo.perUserLimit) {
    //   return {
    //     ok: false as const,
    //     message: "Bạn đã dùng mã này đủ số lần cho phép",
    //   };
    // }
  }

  // baseAmount sẽ được truyền từ createPayment dựa trên plan
  const baseAmount =
    normalizeBaseAmount(promo.baseAmount) || PLAN_PRICES.monthly_159; // Default cho gói 159k
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

    const { code, plan } = req.body || {};
    const planKey =
      typeof plan === "string" && ["monthly_79", "monthly_159"].includes(plan)
        ? (plan as PaymentPlan)
        : null;
    const baseAmountFromPlan = planKey
      ? PLAN_PRICES[planKey]
      : PLAN_PRICES.monthly_159;

    const codeStr = String(code || "").trim().toUpperCase();
    if (!codeStr) {
      return res.status(400).json({ message: "Thiếu mã khuyến mãi" });
    }

    const promo = await PromoCode.findOne({ code: codeStr })
      .lean<PromoDoc>()
      .exec();
    if (!promo) {
      return res.status(400).json({ message: "Mã không tồn tại" });
    }

    const now = Date.now();
    const getDateTimestamp = (date: any): number | null => {
      if (!date) return null;
      if (date instanceof Date) return date.getTime();
      if (typeof date === "string") {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? null : parsed.getTime();
      }
      if (typeof date === "object" && date.$date) {
        const parsed = new Date(date.$date);
        return isNaN(parsed.getTime()) ? null : parsed.getTime();
      }
      return null;
    };

    const activeFromTime = getDateTimestamp(promo.activeFrom);
    if (activeFromTime !== null && now < activeFromTime) {
      const startDate = new Date(activeFromTime);
      return res.status(400).json({
        message: `Mã chưa tới thời gian áp dụng (bắt đầu: ${startDate.toLocaleDateString("vi-VN")})`,
      });
    }

    const activeToTime = getDateTimestamp(promo.activeTo);
    if (activeToTime !== null && now > activeToTime) {
      const expiredDate = new Date(activeToTime);
      return res.status(400).json({
        message: `Mã đã hết hạn (hết hạn: ${expiredDate.toLocaleDateString("vi-VN")})`,
      });
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: "Mã đã hết lượt sử dụng" });
    }

    const promoBaseAmount = normalizeBaseAmount(promo.baseAmount);

    if (
      planKey &&
      promoBaseAmount &&
      promoBaseAmount !== PLAN_PRICES[planKey]
    ) {
      const planLabel =
        promoBaseAmount === PLAN_PRICES.monthly_159
          ? "gói Premium 159k / 3 tháng"
          : promoBaseAmount === PLAN_PRICES.monthly_79
            ? "gói Premium 79k / tháng"
            : `gói Premium với giá gốc ${promoBaseAmount.toLocaleString("vi-VN")}đ`;
      return res
        .status(400)
        .json({ message: `Mã này chỉ áp dụng cho ${planLabel}` });
    }

    // Sử dụng baseAmount từ plan hoặc từ promo
    const baseAmountForCalc =
      planKey
        ? PLAN_PRICES[planKey]
        : promoBaseAmount || baseAmountFromPlan;
    const amountAfter = computeDiscountedAmount({
      baseAmount: baseAmountForCalc,
      type: promo.type ?? null,
      value: promo.value ?? null,
      amountAfter: promo.amountAfter ?? null,
    });

    return res.json({
      data: {
        code: promo.code,
        amountBefore: baseAmountForCalc,
        amountAfter,
        type: promo.type,
        value: promo.value ?? undefined,
        activeFrom: promo.activeFrom ?? undefined,
        activeTo: promo.activeTo ?? undefined,
        plan: planKey ?? undefined,
      },
    });
  } catch (e: any) {
    console.error("validatePromo error:", e?.message || e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Nâng cấp user và set expiry date */
async function upgradeUserToPremium(
  userId: string,
  plan: PaymentPlan,
  paymentDate: Date = new Date()
) {
  const user = await User.findById(userId);
  if (!user) return;

  const durationMonths = PLAN_DURATIONS[plan];
  const expiryDate = new Date(paymentDate);
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

  // Nếu user đã có premium và expiryDate > paymentDate, cộng thêm thời gian
  if (user.access === "premium" && user.premiumExpiryDate) {
    const currentExpiry = new Date(user.premiumExpiryDate);
    if (currentExpiry > paymentDate) {
      // Cộng thêm thời gian vào ngày hết hạn hiện tại
      expiryDate.setMonth(currentExpiry.getMonth() + durationMonths);
    }
  }

  user.access = "premium";
  user.premiumExpiryDate = expiryDate;
  await user.save();
  console.log(
    `✅ User ${user.email} (${user._id}) upgraded to premium until ${expiryDate.toISOString()}`
  );
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

    const plan = (payment.plan as PaymentPlan) || "monthly_79"; // Default nếu không có plan
    await upgradeUserToPremium(
      payment.userId.toString(),
      plan,
      payment.paidAt || new Date()
    );

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
        // Increment usage count
        await PromoCode.updateOne({ code: payment.promoCode }, { $inc: { usedCount: 1 } });
      } catch (e) {
        console.warn("PromoRedemption save failed:", (e as any)?.message || e);
      }
    }
  } else if (
    info.status === "CANCELLED" &&
    payment.status !== PaymentStatus.CANCELLED
  ) {
    payment.status = PaymentStatus.CANCELLED;
    await payment.save();
  } else if (
    info.status === "EXPIRED" &&
    payment.status !== PaymentStatus.EXPIRED
  ) {
    payment.status = PaymentStatus.EXPIRED;
    await payment.save();
  }

  return payment;
}

/** POST /api/payments/create */
export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Kiểm tra nếu user đã có premium và chưa hết hạn
    if (user.access === "premium" && user.premiumExpiryDate) {
      const expiryDate = new Date(user.premiumExpiryDate);
      if (expiryDate > new Date()) {
        return res.status(400).json({
          message: `Bạn đã là thành viên Premium đến ${expiryDate.toLocaleDateString("vi-VN")}`
        });
      }
    }

    const { plan, promoCode } = req.body || {};

    // Validate plan
    if (!plan || !["monthly_79", "monthly_159"].includes(plan)) {
      return res.status(400).json({
        message: "Vui lòng chọn gói: monthly_79 hoặc monthly_159"
      });
    }

    const selectedPlan = plan as PaymentPlan;
    const amountBefore = PLAN_PRICES[selectedPlan];
    let amountAfter = amountBefore;
    let appliedPromo: string | null = null;

    if (promoCode) {
      // Validate promo với baseAmount của plan được chọn
      const code = String(promoCode || "").trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ message: "Thiếu mã khuyến mãi" });
      }

      const promo = await PromoCode.findOne({ code }).lean<PromoDoc>().exec();
      if (!promo) {
        return res.status(400).json({ message: "Mã không tồn tại" });
      }

      // Kiểm tra các điều kiện khác (thời gian, số lần dùng, etc.)
      const now = Date.now();
      const getDateTimestamp = (date: any): number | null => {
        if (!date) return null;
        if (date instanceof Date) return date.getTime();
        if (typeof date === "string") {
          const parsed = new Date(date);
          return isNaN(parsed.getTime()) ? null : parsed.getTime();
        }
        if (typeof date === "object") {
          if (date.$date) {
            const parsed = new Date(date.$date);
            return isNaN(parsed.getTime()) ? null : parsed.getTime();
          }
        }
        return null;
      };

      const activeFromTime = getDateTimestamp(promo.activeFrom);
      if (activeFromTime !== null && now < activeFromTime) {
        return res.status(400).json({ message: "Mã chưa tới thời gian áp dụng" });
      }

      const activeToTime = getDateTimestamp(promo.activeTo);
      if (activeToTime !== null && now > activeToTime) {
        return res.status(400).json({ message: "Mã đã hết hạn" });
      }

      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return res.status(400).json({ message: "Mã đã hết lượt sử dụng" });
      }

      const promoBaseAmount = normalizeBaseAmount(promo.baseAmount);

      if (promoBaseAmount && promoBaseAmount !== amountBefore) {
        const planLabel =
          promoBaseAmount === PLAN_PRICES.monthly_159
            ? "gói Premium 159k / 3 tháng"
            : promoBaseAmount === PLAN_PRICES.monthly_79
              ? "gói Premium 79k / tháng"
              : `gói Premium với giá gốc ${promoBaseAmount.toLocaleString("vi-VN")}đ`;
        return res
          .status(400)
          .json({ message: `Mã này chỉ áp dụng cho ${planLabel}` });
      }

      // Tính toán giá sau giảm với baseAmount của plan
      const baseAmountForPromo = promoBaseAmount || amountBefore;
      amountAfter = computeDiscountedAmount({
        baseAmount: baseAmountForPromo,
        type: promo.type ?? null,
        value: promo.value ?? null,
        amountAfter: promo.amountAfter ?? null,
      });
      appliedPromo = promo.code;
    }

    // Nếu số tiền <= 0, kích hoạt luôn không cần qua cổng thanh toán
    if (amountAfter <= 0) {
      const durationMonths = PLAN_DURATIONS[selectedPlan];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      const orderCode = Date.now();

      const payment = new Payment({
        userId,
        orderCode,
        amount: 0,
        amountBefore,
        amountAfter: 0,
        description: `Free Upgrade: ${selectedPlan}`,
        status: PaymentStatus.PAID, // Đã thanh toán (free)
        payOSCheckoutUrl: null,
        payOSQrCode: null,
        returnUrl: "",
        cancelUrl: "",
        promoCode: appliedPromo,
        plan: selectedPlan,
        premiumExpiryDate: expiryDate,
        paidAt: new Date(),
      });
      await payment.save();

      // Nâng cấp user ngay lập tức
      await upgradeUserToPremium(userId, selectedPlan, new Date());

      // Lưu redemption
      if (appliedPromo) {
        try {
          await PromoRedemption.create({
            promoCode: appliedPromo,
            userId,
            paymentId: payment._id,
            amountBefore,
            amountAfter: 0,
          });
          // Increment usage count
          await PromoCode.updateOne({ code: appliedPromo }, { $inc: { usedCount: 1 } });
        } catch (e) {
          console.warn("PromoRedemption save failed:", (e as any)?.message || e);
        }
      }

      return res.json({
        data: {
          checkoutUrl: null, // Không có link thanh toán
          qrCode: null,
          orderCode,
          isFree: true, // Flag để frontend biết
        },
      });
    }

    // Nếu số tiền > 0, đảm bảo tối thiểu 2000đ cho PayOS
    if (amountAfter < 2000) amountAfter = 2000;

    const planLabels: Record<PaymentPlan, string> = {
      monthly_79: "Premium 79k/tháng",
      monthly_159: "Premium 159k/3 tháng",
    };

    const description = planLabels[selectedPlan];
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
      items: [
        { name: description, quantity: 1, price: amountAfter },
      ],
    });

    // Tính expiry date
    const durationMonths = PLAN_DURATIONS[selectedPlan];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    await new Payment({
      userId,
      orderCode,
      amount: amountAfter, // số tiền thực trả
      amountBefore, // giữ lại giá gốc để đối chiếu
      amountAfter, // giá sau giảm
      description,
      status: PaymentStatus.PENDING,
      payOSCheckoutUrl: paymentLinkData.checkoutUrl,
      payOSQrCode: paymentLinkData.qrCode,
      returnUrl,
      cancelUrl,
      promoCode: appliedPromo, // null nếu không dùng mã
      plan: selectedPlan,
      premiumExpiryDate: expiryDate,
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
export async function getPaymentStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
      console.error("Invalid PayOS webhook payload:", {
        code,
        hasData: !!data,
      });
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

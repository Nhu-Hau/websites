import { Request, Response } from "express";
import { Types } from "mongoose";
import { PaymentOrder, IPaymentOrder } from "../models/Payment";
import { User } from "../models/User";

// ====== CREATE VIETQR ======
export async function createVietQR(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { courseSlug, kind = "course", amount } = (req.body || {}) as {
      courseSlug?: string;
      kind?: "course" | "premium";
      amount?: number;
    };

    if (kind === "course" && !courseSlug) {
      return res.status(400).json({ message: "Thiếu courseSlug" });
    }

    const finalAmount = Number(amount || 99000);
    if (!finalAmount || finalAmount < 1000) {
      return res.status(400).json({ message: "Số tiền không hợp lệ" });
    }

    const memo = kind === "premium" ? "PREMIUM_UPGRADE" : `COURSE_${courseSlug}`;

    const order = await PaymentOrder.create({
      userId,
      kind,
      courseSlug: kind === "course" ? courseSlug! : null,
      amount: finalAmount,
      currency: "VND",
      memo,
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });

    const bank = process.env.VIETQR_BANK || "VCB";
    const acc = process.env.VIETQR_ACCOUNT || "";
    const name = process.env.VIETQR_ACCOUNT_NAME || "";
    const tpl = process.env.VIETQR_TEMPLATE || "compact";

    const escapedName = encodeURIComponent(name);
    const escapedMemo = encodeURIComponent(`ORDER_${order._id}`);
    const qrUrl =
      `https://img.vietqr.io/image/${bank}-${acc}-${tpl}.png` +
      `?amount=${finalAmount}&addInfo=${escapedMemo}&accountName=${escapedName}`;

    return res.json({
      orderId: String(order._id),
      amount: finalAmount,
      currency: "VND",
      memo: `ORDER_${order._id}`,
      qrUrl,
      expiresAt: order.expiresAt,
    });
  } catch (e: any) {
    console.error("createVietQR error:", e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}

// ====== CHECK STATUS ======
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const rawUserId = (req as any).auth?.userId;
    if (!rawUserId) return res.status(401).json({ message: "Unauthorized" });

    const { orderId } = req.params;
    if (!Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await PaymentOrder.findById(orderId)
      .select("_id userId status memo amount currency expiresAt paidAt")
      .lean()
      .exec();

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn" });
    if (String(order.userId) !== String(rawUserId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({
      orderId: String(orderId),
      status: order.status,
      memo: order.memo,
      amount: order.amount,
      currency: order.currency,
      expiresAt: order.expiresAt ? new Date(order.expiresAt).toISOString() : null,
      paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : null,
    });
  } catch (e: any) {
    console.error("getPaymentStatus error:", e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}

// ====== CONFIRM (DEMO) ======
// Người dùng bấm "Tôi đã chuyển khoản" -> backend đánh dấu paid và mở khóa
export async function confirmVietQR(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { orderId } = (req.body || {}) as { orderId?: string };
    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await PaymentOrder.findById(orderId).exec();
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn" });
    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (order.status === "paid") {
      return res.json({ ok: true, status: "paid" });
    }

    // Đánh dấu đã thanh toán (DEMO)
    order.status = "paid";
    order.paidAt = new Date();
    await order.save();

    // Mở khóa cho user
    const user = await User.findById(userId).exec();
    if (user) {
      if (order.kind === "premium") {
        user.access = "premium";
        await user.save();
      } else if (order.kind === "course" && order.courseSlug) {
        const exists = Array.isArray(user.purchases)
          ? user.purchases.some((p: any) => p.slug === order.courseSlug)
          : false;
        if (!exists) {
          user.purchases.push({
            slug: order.courseSlug,
            purchasedAt: new Date(),
          } as any);
          await user.save();
        }
      }
    }

    return res.json({ ok: true, status: "paid" });
  } catch (e: any) {
    console.error("confirmVietQR error:", e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}
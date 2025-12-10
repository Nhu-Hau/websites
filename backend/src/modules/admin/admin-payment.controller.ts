import { Request, Response } from "express";
import { Payment, IPayment, PaymentStatus, PaymentPlan } from "../../shared/models/Payment";
import { User } from "../../shared/models/User";
import { FilterQuery } from "mongoose";

// Thời hạn các gói
const PLAN_DURATIONS: Record<PaymentPlan, number> = {
    monthly_79: 1,   // 1 tháng
    monthly_159: 3,  // 3 tháng
};

/** Nâng cấp user lên premium */
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

export async function listPayments(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const q = (req.query.q as string || "").trim();
        const status = req.query.status as string;
        const plan = req.query.plan as string;

        const filter: FilterQuery<IPayment> = {};

        if (status) {
            filter.status = status;
        }

        if (plan) {
            filter.plan = plan;
        }

        if (q) {
            const orderCode = parseInt(q);
            if (!isNaN(orderCode)) {
                filter.orderCode = orderCode;
            }
            // Note: Searching by user name/email would require aggregation or separate lookup
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Payment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "name email picture")
                .lean(),
            Payment.countDocuments(filter),
        ]);

        const pages = Math.ceil(total / limit);

        return res.json({
            items,
            total,
            page,
            limit,
            pages,
        });
    } catch (error) {
        console.error("listPayments error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPayment(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id)
            .populate("userId", "name email picture")
            .lean();

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        return res.json({ item: payment });
    } catch (error) {
        console.error("getPayment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updatePaymentStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = Object.values(PaymentStatus);
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        const oldStatus = payment.status;
        const isBecomingPaid = oldStatus !== PaymentStatus.PAID && status === PaymentStatus.PAID;
        const isRevokingPaid = oldStatus === PaymentStatus.PAID && status !== PaymentStatus.PAID;

        payment.status = status;

        // If marking as paid, set paidAt
        if (status === PaymentStatus.PAID && !payment.paidAt) {
            payment.paidAt = new Date();
        }

        await payment.save();

        // Nâng cấp user lên premium nếu chuyển sang PAID
        if (isBecomingPaid && payment.userId) {
            const plan = (payment.plan as PaymentPlan) || "monthly_79";
            await upgradeUserToPremium(
                payment.userId.toString(),
                plan,
                payment.paidAt || new Date()
            );
            console.log(`✅ Payment ${payment.orderCode} status changed: ${oldStatus} → ${status} (User upgraded to premium)`);
        } else if (isRevokingPaid && payment.userId) {
            // Nếu hủy trạng thái paid, hạ cấp user về free
            const user = await User.findById(payment.userId);
            if (user && user.access === "premium") {
                user.access = "free";
                user.premiumExpiryDate = null;
                await user.save();
                console.log(`⚠️ Payment ${payment.orderCode} status revoked: ${oldStatus} → ${status} (User downgraded to free)`);
            }
        } else {
            console.log(`✅ Payment ${payment.orderCode} status changed: ${oldStatus} → ${status}`);
        }

        return res.json({
            message: "Status updated successfully",
            item: payment
        });
    } catch (error) {
        console.error("updatePaymentStatus error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function deletePayment(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        await Payment.deleteOne({ _id: id });

        console.log(`🗑️ Payment ${payment.orderCode} deleted by admin`);

        return res.json({ message: "Payment deleted successfully" });
    } catch (error) {
        console.error("deletePayment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


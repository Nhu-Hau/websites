import { Request, Response } from "express";
import { Payment, IPayment } from "../../shared/models/Payment";
import { FilterQuery } from "mongoose";

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

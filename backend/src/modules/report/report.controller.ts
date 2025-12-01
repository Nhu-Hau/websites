import { Request, Response } from "express";
import { Report } from "./Report";
import { User } from "../../shared/models/User";

// User: Tạo báo cáo mới
export async function createReport(req: Request, res: Response) {
    try {
        const userId = (req as any).auth?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { questionId, testId, content } = req.body;

        if (!questionId || !testId || !content) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const report = await Report.create({
            userId,
            questionId,
            testId,
            content,
        });

        res.status(201).json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Admin: Lấy danh sách báo cáo
export async function getReports(req: Request, res: Response) {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter: any = {};
        if (status) filter.status = status;

        const [items, total] = await Promise.all([
            Report.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("userId", "name email avatar"), // Populate user info
            Report.countDocuments(filter),
        ]);

        res.json({
            items,
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Admin: Cập nhật trạng thái báo cáo
export async function updateReportStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "resolved", "ignored"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const report = await Report.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

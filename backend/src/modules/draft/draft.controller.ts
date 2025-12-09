// backend/src/modules/draft/draft.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TestDraft } from "../../shared/models/TestDraft";

const DRAFT_TTL_DAYS = 7;

/**
 * POST /api/draft/save
 * Lưu hoặc cập nhật draft bài làm
 */
export async function saveDraft(req: Request, res: Response) {
    try {
        const userId = (req as any).auth?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập" });
        }

        const { testType, testKey, answers, allIds, timeSec, startedAt } = req.body as {
            testType?: "practice" | "progress" | "placement";
            testKey?: string;
            answers?: Record<string, string>;
            allIds?: string[];
            timeSec?: number;
            startedAt?: string;
        };

        if (!testType || !testKey) {
            return res.status(400).json({ message: "Thiếu testType hoặc testKey" });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + DRAFT_TTL_DAYS);

        const draft = await TestDraft.findOneAndUpdate(
            {
                userId: new Types.ObjectId(String(userId)),
                testType,
                testKey,
            },
            {
                $set: {
                    answers: answers || {},
                    allIds: allIds || [],
                    timeSec: timeSec || 0,
                    startedAt: startedAt ? new Date(startedAt) : null,
                    savedAt: new Date(),
                    expiresAt,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        );

        return res.json({
            message: "Đã lưu draft",
            draftId: draft._id,
            savedAt: draft.savedAt,
        });
    } catch (e) {
        console.error("[saveDraft] ERROR", e);
        return res.status(500).json({ message: "Lỗi khi lưu draft" });
    }
}

/**
 * GET /api/draft/:testType/:testKey
 * Lấy draft bài làm (nếu có)
 */
export async function getDraft(req: Request, res: Response) {
    try {
        const userId = (req as any).auth?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập" });
        }

        const { testType, testKey } = req.params;

        if (!testType || !testKey) {
            return res.status(400).json({ message: "Thiếu testType hoặc testKey" });
        }

        const draft = await TestDraft.findOne({
            userId: new Types.ObjectId(String(userId)),
            testType,
            testKey,
        }).lean();

        if (!draft) {
            return res.json({ draft: null });
        }

        return res.json({
            draft: {
                answers: draft.answers,
                allIds: draft.allIds,
                timeSec: draft.timeSec,
                startedAt: draft.startedAt,
                savedAt: draft.savedAt,
            },
        });
    } catch (e) {
        console.error("[getDraft] ERROR", e);
        return res.status(500).json({ message: "Lỗi khi lấy draft" });
    }
}

/**
 * DELETE /api/draft/:testType/:testKey
 * Xóa draft bài làm (sau khi submit thành công)
 */
export async function deleteDraft(req: Request, res: Response) {
    try {
        const userId = (req as any).auth?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập" });
        }

        const { testType, testKey } = req.params;

        if (!testType || !testKey) {
            return res.status(400).json({ message: "Thiếu testType hoặc testKey" });
        }

        await TestDraft.deleteOne({
            userId: new Types.ObjectId(String(userId)),
            testType,
            testKey,
        });

        return res.json({ message: "Đã xóa draft" });
    } catch (e) {
        console.error("[deleteDraft] ERROR", e);
        return res.status(500).json({ message: "Lỗi khi xóa draft" });
    }
}

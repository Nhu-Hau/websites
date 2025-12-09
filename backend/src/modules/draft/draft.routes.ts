// backend/src/modules/draft/draft.routes.ts
import { Router } from "express";
import { saveDraft, getDraft, deleteDraft } from "./draft.controller";
import { requireAuth } from "../../shared/middleware/auth.middleware";

const router = Router();

// Tất cả routes đều cần auth
router.use(requireAuth);

// POST /api/draft/save - Lưu/update draft
router.post("/save", saveDraft);

// GET /api/draft/:testType/:testKey - Lấy draft
router.get("/:testType/:testKey", getDraft);

// DELETE /api/draft/:testType/:testKey - Xóa draft
router.delete("/:testType/:testKey", deleteDraft);

export default router;

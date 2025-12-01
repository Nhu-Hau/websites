import { Router } from "express";
import { requireAuth, requireAdminAuth } from "../../shared/middleware/auth.middleware";
import { createReport, getReports, updateReportStatus } from "./report.controller";

const router = Router();

// User routes
router.post("/", requireAuth, createReport);

// Admin routes
router.get("/admin", requireAdminAuth, getReports);
router.patch("/admin/:id", requireAdminAuth, updateReportStatus);

export default router;

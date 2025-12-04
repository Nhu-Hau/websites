//backend/src/routes/notification.routes.ts
//backend/src/routes/notification.routes.ts
import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import {
  listMyNotifications,
  clearMyNotifications,
  markAllRead,
  createMyNotification,
  adminSendNotification,
} from "./notification.controller";
import { requireAdminAuth } from "../../shared/middleware/auth.middleware";

const router = Router();
router.get("/", requireAuth, listMyNotifications);
router.delete("/clear", requireAuth, clearMyNotifications);
router.post("/mark-read-all", requireAuth, markAllRead);
router.post("/", requireAuth, createMyNotification);

// Admin routes
router.post("/admin/send", requireAdminAuth, adminSendNotification);

export default router;
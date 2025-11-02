//backend/src/routes/notification.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  listMyNotifications,
  clearMyNotifications,
  markAllRead,
  createMyNotification,
} from "../controllers/notification.controller";

const router = Router();
router.get("/", requireAuth, listMyNotifications);
router.delete("/clear", requireAuth, clearMyNotifications);
router.post("/mark-read-all", requireAuth, markAllRead);
router.post("/", requireAuth, createMyNotification);

export default router;
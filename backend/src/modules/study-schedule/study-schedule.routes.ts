// backend/src/routes/study-schedule.routes.ts
import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import {
  createSchedule,
  getUpcoming,
  updateSchedule,
  updateStatus,
  deleteSchedule,
} from "./study-schedule.controller";

const router = Router();

router.post("/", requireAuth, createSchedule);
router.get("/upcoming", requireAuth, getUpcoming);
router.patch("/:id", requireAuth, updateSchedule);
router.patch("/:id/status", requireAuth, updateStatus);
router.delete("/:id", requireAuth, deleteSchedule);

export default router;


// src/routes/practice.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  submitPracticePart,
  getPracticeHistory,
  getPracticeProgress,
  getPracticeAttemptById,
  getPracticeInactivity,
  ackPracticeInactivity,
} from "../controllers/practice.controller";

const router = Router();

router.post("/parts/:partKey/submit", requireAuth, submitPracticePart);
router.get("/history", requireAuth, getPracticeHistory);
router.get("/progress", requireAuth, getPracticeProgress);
router.get("/attempts/:id", requireAuth, getPracticeAttemptById);
router.get("/inactivity", requireAuth, getPracticeInactivity);
router.post("/inactivity/ack", requireAuth, ackPracticeInactivity);

export default router;

// backend/src/routes/progress.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getProgressPaper,
  gradeProgress,
  submitProgress,
  getMyProgressAttempts,
  getProgressAttemptById,
  getProgressAttemptItemsOrdered,
  getProgressEligibility,
  ackProgressEligibility, 
} from "../controllers/progress.controller";

const router = Router();

/** Mount ở app.ts: app.use("/api/progress", router) */
router.get("/paper", getProgressPaper);
router.post("/grade", gradeProgress);
router.post("/submit", requireAuth, submitProgress);

router.get("/attempts", requireAuth, getMyProgressAttempts);
router.get("/attempts/:id", requireAuth, getProgressAttemptById);
router.get("/attempts/:id/items", requireAuth, getProgressAttemptItemsOrdered);

router.get("/eligibility", requireAuth, getProgressEligibility);
router.post("/eligibility/ack", requireAuth, ackProgressEligibility);

export default router;
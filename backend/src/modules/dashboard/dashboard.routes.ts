// backend/src/routes/dashboard.routes.ts
import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import {
  getActivityData,
  getGoalData,
  setGoal,
  getAssessmentData,
} from "./dashboard.controller";

const router = Router();

router.get("/activity", requireAuth, getActivityData);
router.get("/goal", requireAuth, getGoalData);
router.post("/goal", requireAuth, setGoal);
router.get("/assessment", requireAuth, getAssessmentData);

export default router;














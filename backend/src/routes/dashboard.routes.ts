// backend/src/routes/dashboard.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getActivityData,
  getGoalData,
  setGoal,
} from "../controllers/dashboard.controller";

const router = Router();

router.get("/activity", requireAuth, getActivityData);
router.get("/goal", requireAuth, getGoalData);
router.post("/goal", requireAuth, setGoal);

export default router;














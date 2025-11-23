// backend/src/modules/profile/profile.routes.ts
import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import {
  getAssessmentBaseline,
  updateAssessmentBaseline,
} from "../community/profile.controller";

const router = Router();

router.get("/assessment-baseline", requireAuth, getAssessmentBaseline);
router.put("/assessment-baseline", requireAuth, updateAssessmentBaseline);

export default router;


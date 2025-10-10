// src/routes/tests.routes.ts
import { Router } from "express";
import * as ctrl from "../controllers/tests.controller";
import { optionalAuth } from "../middleware/optionalAuth";
import { requireAuth } from "../middleware/requireAuth";
import * as playCtrl from "../controllers/testsPlay.controller";

const router = Router();

// Danh sách test user được xem (gating theo level user; nếu chưa login -> coi như level=1)
router.get("/", optionalAuth, ctrl.listVisibleTests);

// Chi tiết/overview 1 test (gating theo level)
router.get("/:testId", optionalAuth, ctrl.getTestOverview);
router.get("/:testId/items", optionalAuth, playCtrl.getTestItems);
router.post("/:testId/submit", requireAuth, playCtrl.submitTestAttempt);

export default router;
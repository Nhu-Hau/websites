import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import {
  getPlacementPaper,               
  gradePlacement,
  submitPlacement,
  getMyPlacementAttempts,
  getPlacementAttemptById,
  getPlacementAttemptItemsOrdered,
} from "./placement.controller";

const router = Router();

router.get("/paper", getPlacementPaper);           
router.post("/grade", gradePlacement);
router.post("/submit", requireAuth, submitPlacement);
router.get("/attempts", requireAuth, getMyPlacementAttempts);
router.get("/attempts/:id", requireAuth, getPlacementAttemptById);
router.get("/attempts/:id/items", requireAuth, getPlacementAttemptItemsOrdered);

export default router;
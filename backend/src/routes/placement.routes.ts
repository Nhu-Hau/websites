// src/routes/placement.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getPlacementTest,
  getPlacementItems,
  gradePlacement,
  submitPlacement,
  getMyPlacementAttempts,
  getPlacementAttemptById,
  getPlacementAttemptItemsOrdered,
} from "../controllers/placement.controller";

const router = Router();

router.get("/test", getPlacementTest);
router.post("/items", getPlacementItems);
router.post("/grade", gradePlacement);
router.post("/submit", requireAuth, submitPlacement);
router.get("/attempts", requireAuth, getMyPlacementAttempts);
router.get("/attempts/:id", requireAuth, getPlacementAttemptById);
router.get(
  "/placement/attempts/:id/items",
  requireAuth,
  getPlacementAttemptItemsOrdered
);

export default router;

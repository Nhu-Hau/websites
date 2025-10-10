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

/**
 * Mount ở app.ts: app.use("/api/placement", router)
 * => các path dưới đây KHÔNG lặp "/placement" nữa
 */
router.get("/test", getPlacementTest);
router.post("/items", getPlacementItems);
router.post("/grade", gradePlacement);
router.post("/submit", requireAuth, submitPlacement);
router.get("/attempts", requireAuth, getMyPlacementAttempts);
router.get("/attempts/:id", requireAuth, getPlacementAttemptById);

// ⚠️ SỬA path: KHÔNG được viết "/placement/attempts/:id/items"
router.get("/attempts/:id/items", requireAuth, getPlacementAttemptItemsOrdered);

export default router;
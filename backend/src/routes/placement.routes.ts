// src/routes/placement.routes.ts
import { Router } from "express";
import {
  getPlacementTest,
  getPlacementItems,
  gradePlacement,
} from "../controllers/placement.controller";

const router = Router();

router.get("/test", getPlacementTest);
router.post("/items", getPlacementItems);
router.post("/grade", gradePlacement);

export default router;
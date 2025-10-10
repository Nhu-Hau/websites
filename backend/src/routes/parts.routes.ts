// src/routes/parts.routes.ts
import { Router } from "express";
import { getPartItemsByLevel } from "../controllers/parts.controller";

const router = Router();

// GET /api/parts/:partKey/items?level=1&limit=50
router.get("/:partKey/items", getPartItemsByLevel);

export default router;
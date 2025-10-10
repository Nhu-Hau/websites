// src/routes/practice.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { submitPracticePart } from "../controllers/practice.controller";

const router = Router();

// POST /api/practice/parts/:partKey/submit
router.post("/practice/parts/:partKey/submit", requireAuth, submitPracticePart);

export default router;
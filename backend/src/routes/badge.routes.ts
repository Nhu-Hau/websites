// backend/src/routes/badge.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getMyBadges, checkBadges } from "../controllers/badge.controller";

const router = Router();

router.get("/", requireAuth, getMyBadges);
router.post("/check", requireAuth, checkBadges);

export default router;



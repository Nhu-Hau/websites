// backend/src/routes/badge.routes.ts
import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import { getMyBadges, checkBadges } from "./badge.controller";

const router = Router();

router.get("/", requireAuth, getMyBadges);
router.post("/check", requireAuth, checkBadges);

export default router;



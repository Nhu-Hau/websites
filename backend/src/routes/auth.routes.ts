// src/routes/auth.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as auth from "../controllers/auth.controller";
import { noStore } from "../middleware/noStore";

const router = Router();

router.get("/me", requireAuth, auth.me, noStore);
router.post("/logout", auth.logout);
router.post("/refresh", auth.refresh);

router.post("/register", auth.register);
router.post("/login", auth.login);

router.get("/google", auth.google);
router.get("/google/callback", auth.googleCallback);
router.post("/google/complete", auth.completeGoogle);

router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/change-password", requireAuth, auth.changePassword);
router.post("/reset-password-code", auth.resetPasswordCode);
export default router;

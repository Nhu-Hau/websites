// src/routes/auth.routes.ts
import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import * as auth from "./auth.controller";
import { noStore } from "../../shared/middleware/noStore.middleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/me", requireAuth, auth.me, noStore);
router.post("/logout", auth.logout);
router.post("/refresh", auth.refresh);

router.post("/send-verification-code", auth.sendVerificationCode);
router.post("/register", auth.register);
router.post("/register-anonymous", auth.registerAnonymous);
router.post("/recover-account", auth.recoverAccount);
router.post("/login", auth.login);

router.get("/google", auth.google);
router.get("/google/callback", auth.googleCallback);
router.post("/google/complete", auth.completeGoogle);

router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/change-password", requireAuth, auth.changePassword);
router.post("/reset-password-code", auth.resetPasswordCode);

router.post("/avatar", requireAuth, upload.single("avatar"), auth.uploadAvatar);
router.delete("/avatar", requireAuth, auth.deleteAvatar);

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createVietQR,
  getPaymentStatus,
  confirmVietQR,   // 👈 NEW
} from "../controllers/payments.controller";

const router = Router();

router.post("/vietqr/create", requireAuth, createVietQR);
router.post("/vietqr/confirm", requireAuth, confirmVietQR); // 👈 NEW (demo)
router.get("/:orderId", requireAuth, getPaymentStatus);

export default router;
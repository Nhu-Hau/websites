import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as payments from "../controllers/payments.controller";

const router = Router();

// Tạo payment link (yêu cầu đăng nhập)
router.post("/create", requireAuth, payments.createPayment);

// Kiểm tra trạng thái payment
router.get("/status/:orderCode", requireAuth, payments.getPaymentStatus);

// Validate promo code (yêu cầu đăng nhập để áp rule per-user)
router.post("/promo/validate", requireAuth, payments.validatePromo);

// Webhook từ PayOS (không cần auth, nhớ verify chữ ký nếu có)
router.post("/webhook", payments.handlePayOSWebhook);

export default router;
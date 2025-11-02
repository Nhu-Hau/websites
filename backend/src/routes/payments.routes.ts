// backend/src/routes/payments.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as payments from "../controllers/payments.controller";
import * as webhook from "../controllers/payments.webhook.controller";

const router = Router();

// Tạo payment link (yêu cầu đăng nhập)
router.post("/create", requireAuth, payments.createPayment);

// Kiểm tra trạng thái payment
router.get("/status/:orderCode", requireAuth, payments.getPaymentStatus);

// Webhook từ PayOS (không cần auth, nhưng cần verify signature)
router.post("/webhook", webhook.handlePayOSWebhook);

export default router;


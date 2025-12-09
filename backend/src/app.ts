// backend/src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { connectMongo } from "./config/database";
import passport, { initPassport } from "./config/passport";
import {
  authRoutes,
  adminAuthRoutes,
  adminRoutes,
  adminChatRoutes,
  chatRoutes,
  placementRoutes,
  partsRoutes,
  practiceRoutes,
  communityRoutes,
  notificationRoutes,
  paymentsRoutes,
  socketAuthRoutes,
  studyroomRoutes,
  progressRoutes,
  dashboardRoutes,
  badgeRoutes,
  studyScheduleRoutes,
  newsRoutes,
  vocabularyRoutes,
  teacherLeadRoutes,
  profileRoutes,
  reportRoutes,
  draftRoutes,
} from "./modules";

import { UPLOADS_DIR, UPLOADS_ROUTE } from "./config/uploads";
import { exec } from "child_process";

const app = express();

//SECURITY & BASICS

app.set("etag", false); // disable ETag nếu không cần
app.use(helmet()); // các header bảo mật
app.use(cookieParser());
app.use(express.json({ limit: "2mb" })); // parse body JSON

// HTTP Request Logging với Morgan
app.use(morgan("dev")); // Log format: :method :url :status :response-time ms

//CORS
const FRONTEND_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";
const ADMIN_ORIGIN = process.env.ADMIN_URL || "http://localhost:3001";
const MOBILE_ORIGINS = process.env.MOBILE_ORIGINS
  ? process.env.MOBILE_ORIGINS.split(",").map(origin => origin.trim())
  : [];

// Combine all allowed origins
const allowedOrigins = [FRONTEND_ORIGIN, ADMIN_ORIGIN, ...MOBILE_ORIGINS];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // For mobile apps, allow all origins (you can restrict this if needed)
      // Mobile apps typically don't send Origin header
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-user-name",
      "x-user-name-encoded",
      "x-user-role",
      //thêm header này để tránh lỗi CORS khi FE gửi x-user-access
      "x-user-access",
      // Header for mobile app identification
      "x-client-type",
      // Thêm một số header phổ biến khác nếu cần
      "X-Requested-With",
    ],
  })
);

//PASSPORT
initPassport();
app.use(passport.initialize());

//HEALTH CHECK + STATIC
app.get("/health", (_req, res) => res.json({ ok: true }));

// Static uploads: mount đúng 1 lần
app.use(UPLOADS_ROUTE, express.static(UPLOADS_DIR));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

//mount router trước bất kỳ catch-all/404 handler nào

// ===== Webhook deploy từ GitHub (không cần auth, bảo vệ bằng token) =====

const DEPLOY_WEBHOOK_TOKEN = process.env.DEPLOY_WEBHOOK_TOKEN || "";

app.post("/webhook-deploy", (req, res) => {
  const queryToken = req.query.token as string | undefined;
  const headerToken = req.headers["x-deploy-token"] as string | undefined;
  const token = queryToken || headerToken;

  if (!DEPLOY_WEBHOOK_TOKEN || token !== DEPLOY_WEBHOOK_TOKEN) {
    console.warn("[webhook-deploy] Unauthorized request");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const ref = (req.body && (req.body as any).ref) || "";

  if (ref && ref !== "refs/heads/main") {
    console.log("[webhook-deploy] Push nhánh khác, bỏ qua:", ref);
    return res.status(200).json({ message: "Ignored (not main)", ref });
  }

  console.log("[webhook-deploy] Nhận webhook hợp lệ, chạy deploy.sh ở background...");

  // 🔥 Chạy deploy.sh ở background + ghi log ra file, KHÔNG chờ xong
  const cmd =
    "bash /opt/websites/deploy.sh > /opt/websites/deploy.log 2>&1 &";

  exec(cmd); // không cần callback

  return res.json({ message: "Deploy started" });
});

// Auth & Account
app.use("/api/auth", authRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/account", authRoutes); // alias nếu FE đang dùng

// Admin
app.use("/api/admin", adminRoutes);
app.use("/api/admin-chat", adminChatRoutes);

// Core app
app.use("/api/chat", chatRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/parts", partsRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reports", reportRoutes);

// LiveKit / Study rooms
app.use("/api", studyroomRoutes);
app.use("/api/socket-auth", socketAuthRoutes);

// Progress
app.use("/api/progress", progressRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Badges
app.use("/api/badges", badgeRoutes);

// Study Schedules
app.use("/api/study-schedules", studyScheduleRoutes);

// News
app.use("/api/news", newsRoutes);

// Vocabulary
app.use("/api/vocabulary", vocabularyRoutes);

// Teacher leads
app.use("/api", teacherLeadRoutes);

// Draft (test pause/resume)
app.use("/api/draft", draftRoutes);

//404 CHO API (tuỳ chọn)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ message: "Not Found" });
  }
  return next();
});

//ERROR HANDLER
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.type("application/json");
  const payload: any = { message: err?.message || "Internal Server Error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err?.stack;
  res.status(500).json(payload);
});

//BOOTSTRAP
export async function createServer() {
  await connectMongo();
  return app;
}

export default app;

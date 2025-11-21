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
} from "./modules";

import { UPLOADS_DIR, UPLOADS_ROUTE } from "./config/uploads";

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

app.use(
  cors({
    origin: [FRONTEND_ORIGIN, ADMIN_ORIGIN],
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

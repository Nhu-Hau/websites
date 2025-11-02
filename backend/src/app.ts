// backend/src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import { connectMongo } from "./lib/mongoose";
import passport, { initPassport } from "./lib/passport";

import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import placementRoutes from "./routes/placement.routes";
import partsRoutes from "./routes/parts.routes";
import adminRoutes from "./routes/admin.routes";
import adminChatRoutes from "./routes/adminChat.routes";
import adminAuthRoutes from "./routes/adminAuth.routes";
import socketAuthRoutes from "./routes/socketAuth.routes";
import practiceRoutes from "./routes/practice.routes";
import communityRoutes from "./routes/community.routes";
import paymentsRoutes from "./routes/payments.routes";

// LiveKit routes
import studyRoomsRoutes from "./routes/studyRooms.routes";       // POST /api/rooms, POST /api/rooms/:room/token
import roomsAdminRoutes from "./routes/rooms.admin.routes";      // GET /api/rooms, participants, kick, mute
import lkDiagRoutes from "./routes/livekit.diag.routes";         // /api/_lk/env, /api/_lk/ping
import livekitWebhookRoutes from "./routes/livekit.webhook.routes";
import roomsDebugRoutes from './routes/rooms.debug.routes';
import { UPLOADS_DIR, UPLOADS_ROUTE } from "./config/uploads";
import { startCleanupRooms } from './jobs/cleanupRooms';

const app = express();

const FRONTEND_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";
const ADMIN_ORIGIN = process.env.ADMIN_URL || "http://localhost:3001";

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, ADMIN_ORIGIN],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // thêm demo headers để FE gọi được /token khi chưa có auth thật
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-name", "x-user-role"],
  })
);
app.use(morgan("dev"));

initPassport();
app.use(passport.initialize());

app.get("/health", (_req, res) => res.json({ ok: true }));

// ============ App routes ============
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/parts", partsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-chat", adminChatRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/socket-auth", socketAuthRoutes);
app.use("/api/practice", practiceRoutes);   // sửa: mount đúng prefix /api/practice
app.use("/api/community", communityRoutes);
app.use("/api/payments", paymentsRoutes);

// ============ LiveKit routes ============
app.use("/api", studyRoomsRoutes);        // => POST /api/rooms, POST /api/rooms/:room/token
app.use("/api", roomsAdminRoutes);        // => GET /api/rooms, ...
app.use("/api", lkDiagRoutes);            // => /api/_lk/env, /api/_lk/ping
app.use("/api", livekitWebhookRoutes);    // => /api/livekit/webhook
app.use('/api', roomsDebugRoutes);
// static
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(UPLOADS_ROUTE, express.static(UPLOADS_DIR));

// error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.type("application/json");
  const payload: any = { message: err?.message || "Internal Server Error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err?.stack;
  res.status(500).json(payload);
});

export async function createServer() {
  await connectMongo();
  // start background cleanup
  startCleanupRooms();
  return app;
}

app.set("etag", false);

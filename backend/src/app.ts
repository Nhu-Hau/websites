import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import testsRouter from "./routes/tests.routes";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import { connectMongo } from "./lib/mongoose";
import passport, { initPassport } from "./lib/passport";
import placementRoutes from "./routes/placement.routes";
import partsRoutes from "./routes/parts.routes";
import adminRoutes from "./routes/admin.routes";
import adminChatRoutes from "./routes/adminChat.routes";
import adminAuthRoutes from "./routes/adminAuth.routes";
import socketAuthRoutes from "./routes/socketAuth.routes";
import practiceRoutes from "./routes/practice.routes";
import coursesRoutes from "./routes/courses.routes";
import paymentsRoutes from "./routes/payments.routes";

const app = express();
const FRONTEND_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";
const ADMIN_ORIGIN = process.env.ADMIN_URL || "http://localhost:3001";

// Tất cả middleware chung nên đặt ở đây
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, ADMIN_ORIGIN],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(morgan("dev"));
initPassport();
app.use(passport.initialize());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/tests", testsRouter);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/parts", partsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-chat", adminChatRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/socket-auth", socketAuthRoutes);
app.use("/api", practiceRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/payments", paymentsRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ message: err?.message || "Internal Server Error" });
});

export async function createServer() {
  await connectMongo();
  return app;
}

app.set("etag", false);
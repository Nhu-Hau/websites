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
import itemsRoutes from "./routes/items.routes";
import attemptRoutes from "./routes/attempt.routes";
import placementRoutes from "./routes/placement.routes";
// import communityRoutes from "./routes/community.routes";

const app = express();

const FRONTEND_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true, // để cookie đi kèm
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
initPassport();
app.use(passport.initialize());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/tests", testsRouter);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/placement", placementRoutes);
// app.use("/api/community", communityRoutes);

app.use(cookieParser());
// Cho phép gửi cookie từ FE (Next chạy ở 3000)
app.use(
  cors({
    origin: ["http://localhost:3000"], // thêm domain FE của bạn
    credentials: true,
  })
);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ message: err?.message || "Internal Server Error" });
});

export async function createServer() {
  await connectMongo();
  return app;
}

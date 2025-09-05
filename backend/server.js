const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("dotenv").config();

// Import passport configuration
require("./config/passport");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const googleAuthRoutes = require("./routes/googleAuth");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server đang hoạt động",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Lỗi server nội bộ",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint không tồn tại",
  });
});

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Kết nối MongoDB thành công");
      startServer();
    })
    .catch((err) => {
      console.error("Lỗi kết nối MongoDB:", err.message);
      console.log("Server sẽ chạy mà không có database");
      startServer();
    });
} else {
  console.log(
    "⚠️  MONGODB_URI không được cấu hình, server sẽ chạy mà không có database"
  );
  startServer();
}

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
    console.log(
      `Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
    );
    console.log(`Google OAuth: /api/auth/google`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

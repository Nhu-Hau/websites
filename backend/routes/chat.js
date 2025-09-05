const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ChatSession = require("../models/ChatSession");

// POST /api/chat
// Body: { messages: [{ role: "user"|"assistant"|"system", content: string }] }
// Yêu cầu đăng nhập và ghi log hội thoại theo session
router.post("/", protect, async (req, res) => {
  try {
    const { messages, sessionId } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu tin nhắn",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY chưa được cấu hình",
      });
    }

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      const errMsg = data?.error?.message || "Yêu cầu OpenAI thất bại";
      return res.status(500).json({ success: false, message: errMsg });
    }

    const reply = data?.choices?.[0]?.message?.content || "";

    // Lưu log hội thoại
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({
        _id: sessionId,
        user: req.user.id,
      });
    }
    if (!session) {
      session = await ChatSession.create({
        user: req.user.id,
        title: (
          messages?.find?.((m) => m.role === "user")?.content || ""
        ).slice(0, 80),
        messages: [],
      });
    }

    const now = new Date();
    const normalized = messages.map((m) => ({
      role: m.role,
      content: m.content,
      at: now,
    }));
    session.messages.push(...normalized, {
      role: "assistant",
      content: reply,
      at: now,
    });
    session.lastActivityAt = now;
    await session.save();

    return res.json({
      success: true,
      message: "OK",
      data: { reply, sessionId: session._id },
    });
  } catch (error) {
    console.error("Lỗi chat:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
});

// Danh sách session của user
router.get("/sessions", protect, async (req, res) => {
  const sessions = await ChatSession.find({ user: req.user.id })
    .sort({ lastActivityAt: -1 })
    .select("title lastActivityAt createdAt");
  res.json({ success: true, data: { sessions } });
});

// Chi tiết 1 session
router.get("/:id", protect, async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!session) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy phiên chat" });
  }
  res.json({ success: true, data: { session } });
});

module.exports = router;

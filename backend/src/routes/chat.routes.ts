import { Router } from "express";
import { ChatMessage, IChatMessage } from "../models/ChatMessage";
import { requireAuth } from "../middleware/requireAuth";
import { chatService } from "../services/chat.service";

const router = Router();

// GET /api/chat/history/:sessionId - Lấy lịch sử chat
router.get("/history/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await ChatMessage.find({
      userId,
      sessionId,
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/send - Gửi tin nhắn và nhận phản hồi từ AI
router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!message || !sessionId) {
      return res
        .status(400)
        .json({ message: "Message and sessionId are required" });
    }

    // Lưu tin nhắn của user
    const userMessage = new ChatMessage({
      userId,
      role: "user",
      content: message,
      sessionId,
    });
    await userMessage.save();

    // Lấy lịch sử chat gần đây để context
    const recentMessages = await ChatMessage.find({
      userId,
      sessionId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Đảo ngược để có thứ tự đúng
    const contextMessages = recentMessages.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
      userId: msg.userId,
      sessionId: msg.sessionId,
      createdAt: msg.createdAt
    })) as Partial<IChatMessage>[];

    // Gọi AI service để tạo phản hồi (có cá nhân hóa theo userId)
    console.log(`[ChatRoutes] Generating response for userId: ${userId}, sessionId: ${sessionId}, messageCount: ${contextMessages.length}`);
    const aiResponse = await chatService.generateResponse(contextMessages, userId);
    console.log(`[ChatRoutes] AI response received, length: ${aiResponse.length}`);

    // Lưu phản hồi của AI
    const assistantMessage = new ChatMessage({
      userId,
      role: "assistant",
      content: aiResponse,
      sessionId,
    });
    await assistantMessage.save();

    res.json({
      data: {
        userMessage: userMessage.toObject(),
        assistantMessage: assistantMessage.toObject(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/sessions - Lấy danh sách các session chat
router.get("/sessions", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await ChatMessage.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$sessionId",
          lastMessage: { $last: "$content" },
          lastMessageAt: { $last: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 20 },
    ]);

    res.json({ data: sessions });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chat/clear/:sessionId - Xóa tất cả messages trong session
router.delete("/clear/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await ChatMessage.deleteMany({
      userId,
      sessionId,
    });

    res.json({
      message: "Chat cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

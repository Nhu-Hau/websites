import express from "express";
import { AdminChatMessage } from "../../shared/models/AdminChatMessage";
import { User } from "../../shared/models/User";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import { requireAdminAuth } from "../../shared/middleware/auth.middleware";
import { requirePremium } from "../../shared/middleware/auth.middleware";
import { emitNewMessage, emitAdminMessage, emitConversationUpdate } from "../../shared/services/socket.service";

const router = express.Router();

// POST /api/admin-chat/send - User gửi tin nhắn cho admin
router.post("/send", requireAuth, requirePremium, async (req, res, next) => {
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

    // Lấy thông tin user để có email
    const user = await User.findById(userId).select("email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Lưu tin nhắn của user
    const userMessage = new AdminChatMessage({
      userEmail: user.email,
      role: "user",
      content: message,
      sessionId,
      isRead: false,
    });
    await userMessage.save();

    // Emit real-time message
    const io = (global as any).io;
    if (io) {
      console.log("Emitting new message to admin room:", {
        sessionId,
        message: userMessage.toObject(),
        type: "user-message"
      });
      emitNewMessage(io, sessionId, {
        message: userMessage.toObject(),
        type: "user-message"
      });
    } else {
      console.log("No socket.io instance available");
    }

    res.json({
      data: {
        message: userMessage.toObject(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin-chat/history/:sessionId - Lấy lịch sử chat với admin
router.get("/history/:sessionId", requireAuth, requirePremium, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Lấy thông tin user để có email
    const user = await User.findById(userId).select("email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra sessionId có thuộc về user này không
    const sessionExists = await AdminChatMessage.findOne({
      userEmail: user.email,
      sessionId,
    });

    if (!sessionExists) {
      // Nếu sessionId chưa tồn tại, trả về array rỗng (chưa có tin nhắn)
      return res.json({
        data: [],
      });
    }

    const messages = await AdminChatMessage.find({
      userEmail: user.email,
      sessionId,
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      data: messages,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin-chat/sessions - Lấy danh sách session chat của user
router.get("/sessions", requireAuth, requirePremium, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Lấy thông tin user để có email
    const user = await User.findById(userId).select("email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessions = await AdminChatMessage.aggregate([
      { $match: { userEmail: user.email } },
      {
        $group: {
          _id: "$sessionId",
          lastMessage: { $last: "$content" },
          lastMessageAt: { $last: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ["$role", "admin"] }, { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }, 0],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.json({
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin-chat/clear/:sessionId - Xóa session chat
router.delete("/clear/:sessionId", requireAuth, requirePremium, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Lấy thông tin user để có email
    const user = await User.findById(userId).select("email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra sessionId có thuộc về user này không
    const sessionExists = await AdminChatMessage.findOne({
      userEmail: user.email,
      sessionId,
    });

    if (!sessionExists) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    await AdminChatMessage.deleteMany({
      userEmail: user.email,
      sessionId,
    });

    res.json({ message: "Chat session cleared" });
  } catch (err) {
    next(err);
  }
});

// ========== ADMIN ROUTES ==========

// GET /api/admin-chat/admin/conversations - Admin lấy danh sách cuộc trò chuyện
router.get("/admin/conversations", requireAdminAuth, async (req, res, next) => {
  try {
    const conversations = await AdminChatMessage.aggregate([
      {
        $group: {
          _id: "$sessionId",
          userEmail: { $first: "$userEmail" },
          lastMessage: { $last: "$content" },
          lastMessageAt: { $last: "$createdAt" },
          lastMessageRole: { $last: "$role" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$role", "user"] }, { $eq: ["$isRead", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    // Join với User để lấy thông tin user
    const conversationsWithUserInfo = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findOne({ email: conv.userEmail }).select("name email");
        return {
          ...conv,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    res.json({
      data: conversationsWithUserInfo,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin-chat/admin/messages/:sessionId - Admin lấy tin nhắn của session
router.get("/admin/messages/:sessionId", requireAdminAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Kiểm tra sessionId có tồn tại không
    const sessionExists = await AdminChatMessage.findOne({
      sessionId,
    });

    if (!sessionExists) {
      // Nếu sessionId chưa tồn tại, trả về array rỗng (chưa có tin nhắn)
      return res.json({
        data: [],
      });
    }

    const messages = await AdminChatMessage.find({
      sessionId,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Đánh dấu tin nhắn của user là đã đọc
    await AdminChatMessage.updateMany(
      {
        sessionId,
        role: "user",
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      data: messages,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin-chat/admin/reply - Admin trả lời tin nhắn
router.post("/admin/reply", requireAdminAuth, async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const adminId = req.auth?.userId;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!message || !sessionId) {
      return res
        .status(400)
        .json({ message: "Message and sessionId are required" });
    }

    // Lấy thông tin admin để có email
    const admin = await User.findById(adminId).select("email");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Kiểm tra sessionId có tồn tại không
    const existingMessage = await AdminChatMessage.findOne({ sessionId });
    if (!existingMessage) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Lưu tin nhắn của admin
    const adminMessage = new AdminChatMessage({
      userEmail: existingMessage.userEmail,
      adminEmail: admin.email,
      role: "admin",
      content: message,
      sessionId,
      isRead: true,
    });
    await adminMessage.save();

    // Emit real-time admin message
    const io = (global as any).io;
    if (io) {
      emitAdminMessage(io, sessionId, {
        message: adminMessage.toObject(),
        type: "admin-message"
      });
    }

    res.json({
      data: {
        message: adminMessage.toObject(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

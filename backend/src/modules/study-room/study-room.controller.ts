import type { Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { lk, WS_URL_FOR_CLIENT, createJoinToken } from "../../shared/services/livekit.service";
import { uploadBufferToS3, safeDeleteS3 } from "../../shared/services/storage.service";
import { StudyRoom } from "../../shared/models/StudyRoom";
import { User } from "../../shared/models/User";
import { RoomBannedUser } from "../../shared/models/RoomBannedUser";
import { RoomComment } from "../../shared/models/RoomComment";
import { RoomDocument } from "../../shared/models/RoomDocument";
import { RoomSession } from "../../shared/models/RoomSession";
import { SessionParticipant } from "../../shared/models/SessionParticipant";

interface IUserSlim {
  _id: string;
  name: string;
  role: "student" | "teacher" | "admin";
  access?: "free" | "premium";
}

/* ---------------- Room ---------------- */

export async function createRoom(req: Request, res: Response) {
  try {
    const body = z
      .object({
        roomName: z
          .string()
          .min(3)
          .max(64)
          .regex(/^[a-zA-Z0-9_-]+$/),
      })
      .parse(req.body);

    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId)
      .select("name role")
      .lean<IUserSlim | null>();
    if (!user) return res.status(404).json({ message: "User not found" });

    // ensure room on LiveKit
    try {
      await lk.createRoom({
        name: body.roomName,
        maxParticipants: 50,
        emptyTimeout: 300,
      });
    } catch (err: any) {
      if (!String(err?.message || "").includes("already exists")) throw err;
    }

    await StudyRoom.updateOne(
      { roomName: body.roomName },
      {
        $setOnInsert: {
          roomName: body.roomName,
          createdBy: { id: userId, name: user.name, role: user.role },
          currentHostId: userId,
          createdAt: new Date(),
        },
        $set: { lastActivityAt: new Date() },
      },
      { upsert: true }
    );

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("createRoom:", err);
    return res.status(500).json({ message: "Failed to create room" });
  }
}

// controllers/studyroom.controller.ts (hoặc file bạn đang dùng)
export async function issueJoinToken(req: Request, res: Response) {
  try {
    const { roomName } = req.params;
    const userId = (req as any).auth?.userId as string;

    const user = await User.findById(userId).select("name role access").lean<{
      _id: string;
      name: string;
      role: "student" | "teacher" | "admin";
      access?: string;
    } | null>();

    if (!user) return res.status(404).json({ message: "User not found" });

    const banned = await RoomBannedUser.findOne({ roomName, userId }).lean();
    if (banned)
      return res.status(403).json({ message: "Bạn đã bị cấm vào phòng này" });

    // đảm bảo phòng tồn tại
    try {
      await lk.createRoom({
        name: roomName,
        maxParticipants: 50,
        emptyTimeout: 300,
      });
    } catch (e: any) {
      if (!e?.message?.includes("already exists")) throw e;
    }

    // Lấy document phòng để biết host hiện tại (nếu có)
    const roomDoc = await StudyRoom.findOne({ roomName }).lean<{
      currentHostId?: string;
      createdBy?: { id: string };
    } | null>();

    // Quy ước: teacher/admin luôn là host; student là host nếu trùng currentHostId
    const hostIdentity = roomDoc?.currentHostId || userId;
    const isHost =
      user.role === "teacher" ||
      user.role === "admin" ||
      userId === roomDoc?.currentHostId;

    const token = await Promise.resolve(
      createJoinToken({
        roomName,
        identity: userId,
        name: user.name,
        role: user.role,
        ttlSeconds: 3600,
        isHost,
      })
    );

    return res.json({
      wsUrl: WS_URL_FOR_CLIENT,
      token,
      identity: userId,
      displayName: user.name,
      role: user.role,
      isHost,
      hostIdentity,
    });
  } catch (err) {
    console.error("issueJoinToken:", err);
    return res.status(500).json({ message: "Failed to issue token" });
  }
}
export async function listPersistedRooms(_req: Request, res: Response) {
  const docs = await StudyRoom.find({}).sort({ createdAt: -1 }).lean();
  const rooms = await lk.listRooms();
  const map = new Map(rooms.map((r: any) => [r.name, r]));
  const payload = docs.map((d: any) => ({
    roomName: d.roomName,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
    numParticipants: (map.get(d.roomName) as any)?.numParticipants ?? 0,
  }));
  res.json({ rooms: payload });
}

export async function deleteStudyRoom(req: Request, res: Response) {
  try {
    const { roomName } = req.params;

    // LiveKit: xoá nếu có
    try {
      await lk.deleteRoom(roomName);
    } catch (e: any) {
      // bỏ qua 404
      if (
        !(
          e?.status === 404 ||
          /not found|does not exist/i.test(e?.message || "")
        )
      ) {
        console.warn("[deleteStudyRoom] LiveKit delete warn:", e?.message || e);
      }
    }

    // Xoá file S3
    const docs = await RoomDocument.find({ roomName }).select("fileKey").lean();
    for (const d of docs) {
      if (d.fileKey) {
        try {
          await safeDeleteS3(d.fileKey);
        } catch {}
      }
    }

    // Xoá DB liên quan
    const sessions = await RoomSession.find({ roomName }).select("_id").lean();
    const sessionIds = sessions.map((s) => s._id);

    await Promise.all([
      StudyRoom.deleteOne({ roomName }),
      RoomDocument.deleteMany({ roomName }),
      RoomBannedUser.deleteMany({ roomName }),
      RoomComment.deleteMany({ roomName }),
      SessionParticipant.deleteMany({ sessionId: { $in: sessionIds } }),
      RoomSession.deleteMany({ roomName }),
    ]);

    return res.json({
      ok: true,
      message: "Đã xoá phòng và tài nguyên liên quan",
    });
  } catch (err: any) {
    console.error("[deleteStudyRoom] error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Xoá phòng thất bại" });
  }
}

/* ---------------- Moderation ---------------- */

export async function kickAndBanUser(req: Request, res: Response) {
  try {
    const { roomName } = req.params;
    const { userId, reason } = req.body as { userId?: string; reason?: string };
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    const kickerId = (req as any).auth?.userId as string | undefined;
    if (!kickerId) return res.status(401).json({ message: "Unauthorized" });

    const kicker = await User.findById(kickerId)
      .select("name role")
      .lean<IUserSlim | null>();
    if (!kicker) return res.status(404).json({ message: "User not found" });

    const room = await StudyRoom.findOne({ roomName }).lean();
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    try {
      const parts = await lk.listParticipants(roomName);
      const p = parts.find((x: any) => x.identity === userId);
      if (p) await lk.removeParticipant(roomName, p.identity);
    } catch (e) {
      console.warn("kickUser warn:", e);
    }

    await RoomBannedUser.updateOne(
      { roomName, userId },
      {
        $setOnInsert: {
          roomName,
          userId,
          bannedBy: { id: kickerId, name: kicker.name, role: kicker.role },
          bannedAt: new Date(),
          reason: reason || "Bị kick khỏi phòng",
        },
      },
      { upsert: true }
    );
    res.json({ message: "Đã kick và cấm người dùng" });
  } catch {
    res.status(500).json({ message: "Lỗi kick user" });
  }
}

export async function unbanUser(req: Request, res: Response) {
  const { roomName, userId } = req.params;
  await RoomBannedUser.deleteOne({ roomName, userId });
  res.json({ message: "Đã gỡ cấm" });
}

/* ---------------- Comments ---------------- */

export async function postComment(req: Request, res: Response) {
  try {
    const { roomName } = req.params;
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const content = String(req.body?.content || "").trim();
    if (!content) return res.status(400).json({ message: "Nội dung trống" });

    const user = await User.findById(userId)
      .select("name role access")
      .lean<IUserSlim | null>();
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.access === "free") {
      const count = await RoomComment.countDocuments({ roomName, userId });
      if (count >= 5)
        return res
          .status(403)
          .json({ message: "Giới hạn 5 comment cho user free" });
    }

    const cmt = await RoomComment.create({
      roomName,
      userId,
      userName: user.name,
      userRole: user.role,
      userAccess: user.access,
      content,
    });
    res.json({ comment: cmt.toObject() });
  } catch {
    res.status(500).json({ message: "Lỗi khi gửi comment" });
  }
}

export async function listComments(req: Request, res: Response) {
  const { roomName } = req.params;
  const comments = await RoomComment.find({ roomName })
    .sort({ createdAt: 1 })
    .lean();
  res.json({ comments });
}

/* ---------------- Documents ---------------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadRoomDocument = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { roomName } = req.params;
      const userId = (req as any).auth?.userId as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ message: "Thiếu file" });

      const user = await User.findById(userId)
        .select("name role access")
        .lean<IUserSlim | null>();
      if (!user) return res.status(404).json({ message: "User not found" });

      const canUpload =
        user.role === "teacher" ||
        user.role === "admin" ||
        user.access === "premium";
      if (!canUpload) {
        return res
          .status(403)
          .json({ message: "Chỉ teacher/admin hoặc Premium mới được upload" });
      }

      const { url, key } = await uploadBufferToS3({
        buffer: file.buffer,
        mime: file.mimetype,
        originalName: file.originalname,
        folder: `room-documents/${roomName}`,
      });

      const doc = await RoomDocument.create({
        roomName,
        uploadedBy: { id: userId, name: user.name, role: user.role },
        fileName: key.split("/").pop(),
        originalName: file.originalname,
        fileUrl: url,
        fileKey: key,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      res.json({ document: doc.toObject() });
    } catch {
      res.status(500).json({ message: "Lỗi upload" });
    }
  },
];

export async function listRoomDocuments(req: Request, res: Response) {
  const { roomName } = req.params;
  const docs = await RoomDocument.find({ roomName })
    .sort({ uploadedAt: -1 })
    .lean();
  res.json({ documents: docs });
}

export async function downloadRoomDocument(req: Request, res: Response) {
  const { roomName, docId } = req.params;

  const userId = (req as any).auth?.userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId)
    .select("role access")
    .lean<IUserSlim | null>();
  if (!user) return res.status(404).json({ message: "User not found" });

  const doc: any = await RoomDocument.findOne({ _id: docId, roomName }).lean();
  if (!doc) return res.status(404).json({ message: "Không tồn tại" });

  const canDownload =
    user.role === "teacher" ||
    user.role === "admin" ||
    user.access === "premium";
  if (!canDownload) {
    return res
      .status(403)
      .json({ message: "Chỉ Premium hoặc Teacher/Admin mới được download" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.redirect(302, doc.fileUrl);
}

export async function deleteRoomDocument(req: Request, res: Response) {
  try {
    const { roomName, docId } = req.params;
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const doc = await RoomDocument.findOne({ _id: docId, roomName });
    if (!doc) return res.status(404).json({ message: "Không tồn tại" });

    const user = await User.findById(userId)
      .select("role")
      .lean<IUserSlim | null>();
    if (!user) return res.status(404).json({ message: "User not found" });

    const ownerId = String((doc as any)?.uploadedBy?.id ?? "");
    if (ownerId !== userId && user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền" });

    await safeDeleteS3(doc.fileKey);
    await RoomDocument.deleteOne({ _id: docId });
    res.json({ message: "Đã xóa tài liệu" });
  } catch {
    res.status(500).json({ message: "Lỗi khi xóa" });
  }
}

/* ---------------- Diag ---------------- */

export function livekitEnv(_req: Request, res: Response) {
  res.json({
    LIVEKIT_WS_URL: process.env.LIVEKIT_WS_URL,
    apiKey: !!process.env.LIVEKIT_API_KEY,
    apiSecret: !!process.env.LIVEKIT_API_SECRET,
  });
}

export async function livekitPing(_req: Request, res: Response) {
  const rooms = await lk.listRooms();
  res.json({ ok: true, count: rooms.length });
}

/* ---------------- Webhook ---------------- */

export async function livekitWebhook(req: Request, res: Response) {
  const e: any = req.body;

  switch (e.event) {
    case "room_started":
      await RoomSession.create({
        roomName: e.room.name,
        startedAt: new Date(),
      });
      break;

    case "participant_joined": {
      const session =
        (await RoomSession.findOne({
          roomName: e.room.name,
          endedAt: { $exists: false },
        }).sort({ createdAt: -1 })) ||
        (await RoomSession.create({
          roomName: e.room.name,
          startedAt: new Date(),
        }));

      await SessionParticipant.updateOne(
        {
          sessionId: session._id,
          identity: e.participant.identity,
          leftAt: { $exists: false },
        },
        {
          $setOnInsert: {
            sessionId: session._id,
            identity: e.participant.identity,
            name: e.participant.name,
            role: e.participant.attributes?.role,
            joinedAt: new Date(),
          },
        },
        { upsert: true }
      );
      break;
    }

    case "participant_left": {
      const session = await RoomSession.findOne({
        roomName: e.room.name,
        endedAt: { $exists: false },
      }).sort({ createdAt: -1 });

      if (session) {
        await SessionParticipant.findOneAndUpdate(
          {
            sessionId: session._id,
            identity: e.participant.identity,
            leftAt: { $exists: false },
          },
          { leftAt: new Date() }
        );
      }
      break;
    }
  }

  res.json({ ok: true });
}

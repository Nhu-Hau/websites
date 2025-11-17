import { Request, Response } from "express";
import mongoose from "mongoose";
import { StudyRoom } from "../../shared/models/StudyRoom";
import { RoomDocument } from "../../shared/models/RoomDocument";
import { RoomComment } from "../../shared/models/RoomComment";
import { RoomBannedUser } from "../../shared/models/RoomBannedUser";
import { safeDeleteS3 } from "../../shared/services/storage.service";
import { lk } from "../../shared/services/livekit.service";
import { deleteStudyRoom as publicDeleteStudyRoom } from "../study-room/study-room.controller";
import { User } from "../../shared/models/User";

function ensureRoomName(value?: string) {
  const name = String(value || "").trim();
  if (!name) {
    throw new Error("roomName is required");
  }
  return name;
}

function ensureObjectId(id?: string) {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw new Error("Invalid id");
  }
  return id;
}

export async function adminListStudyRooms(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || "").trim();

    const filter: Record<string, any> = {};
    if (q) {
      filter.roomName = { $regex: q, $options: "i" };
    }

    const [rooms, total] = await Promise.all([
      StudyRoom.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      StudyRoom.countDocuments(filter),
    ]);

    const roomNames = rooms.map((r) => r.roomName);
    let liveRoomMap = new Map<string, { numParticipants?: number }>();

    try {
      const liveRooms = await lk.listRooms();
      liveRoomMap = new Map(
        liveRooms.map((room: any) => [room.name, { numParticipants: room.numParticipants ?? 0 }])
      );
    } catch (error) {
      console.warn("[adminListStudyRooms] Failed to fetch LiveKit rooms:", error);
    }

    const docStats = roomNames.length
      ? await RoomDocument.aggregate([
          { $match: { roomName: { $in: roomNames } } },
          {
            $group: {
              _id: "$roomName",
              count: { $sum: 1 },
              totalSize: { $sum: "$fileSize" },
            },
          },
        ])
      : [];

    const commentStats = roomNames.length
      ? await RoomComment.aggregate([
          { $match: { roomName: { $in: roomNames } } },
          {
            $group: {
              _id: "$roomName",
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    const bannedStats = roomNames.length
      ? await RoomBannedUser.aggregate([
          { $match: { roomName: { $in: roomNames } } },
          {
            $group: {
              _id: "$roomName",
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    const docMap = new Map(docStats.map((d: any) => [d._id, d]));
    const commentMap = new Map(commentStats.map((c: any) => [c._id, c]));
    const bannedMap = new Map(bannedStats.map((b: any) => [b._id, b]));

    const hostIds = Array.from(
      new Set(
        rooms
          .map((room) => room.currentHostId)
          .filter((id): id is string => Boolean(id) && mongoose.isValidObjectId(id))
      )
    );

    const hosts = hostIds.length
      ? await User.find({ _id: { $in: hostIds } })
          .select("_id name role")
          .lean<{ _id: mongoose.Types.ObjectId; name: string; role: string }[]>()
      : [];

    const hostMap = new Map(
      hosts.map((host) => [
        String(host._id),
        {
          id: String(host._id),
          name: host.name,
          role: host.role,
        },
      ])
    );

    const items = rooms.map((room) => {
      const live = liveRoomMap.get(room.roomName);
      const docs = docMap.get(room.roomName);
      const comments = commentMap.get(room.roomName);
      const bans = bannedMap.get(room.roomName);
      return {
        roomName: room.roomName,
        createdAt: room.createdAt,
        createdBy: room.createdBy,
        currentHostId: room.currentHostId,
        currentHost: room.currentHostId
          ? hostMap.get(room.currentHostId) ?? { id: room.currentHostId }
          : undefined,
        lastActivityAt: room.lastActivityAt,
        numParticipants: live?.numParticipants ?? 0,
        documentsCount: docs?.count ?? 0,
        totalDocumentSize: docs?.totalSize ?? 0,
        commentsCount: comments?.count ?? 0,
        bannedCount: bans?.count ?? 0,
      };
    });

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[adminListStudyRooms] ERROR", error);
    return res.status(500).json({ message: "Không thể tải danh sách phòng học" });
  }
}

export async function adminListRoomComments(req: Request, res: Response) {
  try {
    const roomName = ensureRoomName(req.params.roomName);
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RoomComment.find({ roomName }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RoomComment.countDocuments({ roomName }),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("roomName")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminListRoomComments] ERROR", error);
    return res.status(500).json({ message: "Không thể tải bình luận" });
  }
}

export async function adminDeleteRoomComment(req: Request, res: Response) {
  try {
    const roomName = ensureRoomName(req.params.roomName);
    const commentId = ensureObjectId(req.params.commentId);

    const result = await RoomComment.deleteOne({ _id: commentId, roomName });
    if (!result.deletedCount) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    return res.json({ message: "Đã xóa bình luận" });
  } catch (error) {
    if (error instanceof Error && ["roomName", "Invalid id"].some((msg) => error.message.includes(msg))) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminDeleteRoomComment] ERROR", error);
    return res.status(500).json({ message: "Không thể xóa bình luận" });
  }
}

export async function adminListRoomDocuments(req: Request, res: Response) {
  try {
    const roomName = ensureRoomName(req.params.roomName);
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RoomDocument.find({ roomName }).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
      RoomDocument.countDocuments({ roomName }),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("roomName")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminListRoomDocuments] ERROR", error);
    return res.status(500).json({ message: "Không thể tải tài liệu" });
  }
}

export async function adminDeleteRoomDocument(req: Request, res: Response) {
  try {
    const roomName = ensureRoomName(req.params.roomName);
    const docId = ensureObjectId(req.params.docId);

    const doc = await RoomDocument.findOne({ _id: docId, roomName });
    if (!doc) {
      return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    }

    if (doc.fileKey) {
      try {
        await safeDeleteS3(doc.fileKey);
      } catch (error) {
        console.warn("[adminDeleteRoomDocument] Failed to delete S3 object:", error);
      }
    }

    await RoomDocument.deleteOne({ _id: docId });
    return res.json({ message: "Đã xóa tài liệu" });
  } catch (error) {
    if (error instanceof Error && ["roomName", "Invalid id"].some((msg) => error.message.includes(msg))) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminDeleteRoomDocument] ERROR", error);
    return res.status(500).json({ message: "Không thể xóa tài liệu" });
  }
}

export async function adminDeleteStudyRoom(req: Request, res: Response) {
  return publicDeleteStudyRoom(req, res);
}


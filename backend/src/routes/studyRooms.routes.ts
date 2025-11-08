// src/routes/studyRooms.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { lk, createJoinToken, WS_URL_FOR_CLIENT } from '../lib/livekit';
import { StudyRoom, IStudyRoom } from '../models/StudyRoom';
import { User } from '../models/User';
import { requireAuth } from '../middleware/requireAuth';
import { requireTeacherOrAdmin } from '../middleware/requireTeacherOrAdmin';

const router = Router();

// POST /api/rooms → tạo phòng (chỉ teacher và admin)
router.post('/rooms', requireAuth, requireTeacherOrAdmin, async (req, res) => {
  try {

    const body = z.object({
      roomName: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
      maxParticipants: z.number().int().min(2).max(200).optional(),
      emptyTimeout: z.number().int().min(10).max(3600).optional(),
    }).parse(req.body);

    let room;
    let reused = false;
    
    try {
      room = await lk.createRoom({
        name: body.roomName,
        maxParticipants: body.maxParticipants ?? 50,
        emptyTimeout: body.emptyTimeout ?? 300,

        metadata: JSON.stringify({
          courseId: req.body?.courseId ?? null,
          lessonId: req.body?.lessonId ?? null,
          teacherId: (req as any).auth?.userId,
        }),
      });
    } catch (lkErr: any) {
      if (lkErr?.message?.includes('already exists')) {
        reused = true;
        // Get existing room info
        const rooms = await lk.listRooms();
        room = rooms.find((r: any) => r.name === body.roomName);
      } else {
        throw lkErr;
      }
    }

    // persist to MongoDB (idempotent) - always save even if room already exists in LiveKit
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Lấy thông tin user để có name và role
    const user = await User.findById(userId).select("name role").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const creatorId = userId;
    try {
      await StudyRoom.updateOne(
        { roomName: body.roomName },
        {
          $setOnInsert: {
            roomName: body.roomName,
            createdBy: { id: creatorId, name: user.name, role: user.role },
            currentHostId: creatorId, // Người tạo phòng là chủ phòng ban đầu
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      // Nếu phòng đã tồn tại nhưng chưa có currentHostId, set người tạo làm chủ phòng
      await StudyRoom.updateOne(
        { roomName: body.roomName, currentHostId: { $exists: false } },
        { $set: { currentHostId: creatorId } }
      );
    } catch (mongoErr: any) {
      console.error('MongoDB save error:', mongoErr?.message || mongoErr);
      // Continue even if MongoDB save fails, but log it
    }

    return res.json({ ok: true, room, reused });
  } catch (err: any) {
    const detail = {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      status: err?.status,
      data: err?.response?.data,
      cause: err?.cause,
    };
    console.error('LiveKit createRoom error:', detail);
    return res.status(500).json({ ok: false, message: 'Failed to create room', detail });
  }
});

// POST /api/rooms/:roomName/token → lấy token join
router.post('/rooms/:roomName/token', requireAuth, async (req, res) => {
  try {
    const params = z.object({ roomName: z.string() }).parse(req.params);
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Lấy thông tin user
    const user = await User.findById(userId).select("name role").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure room tồn tại (idempotent)
    try {
      await lk.createRoom({
        name: params.roomName,
        maxParticipants: 50,
        emptyTimeout: 300,
      });
    } catch (e: any) {
      if (!e?.message?.includes('already exists')) {
        console.error('ensure room error:', e?.message || e);
      }
    }

    // Ensure room saved to MongoDB (idempotent) - in case someone joins directly
    try {
      await StudyRoom.updateOne(
        { roomName: params.roomName },
        {
          $setOnInsert: {
            roomName: params.roomName,
            createdBy: { id: userId, name: user.name, role: user.role },
            currentHostId: userId, // Nếu tạo mới, người tạo là chủ phòng
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (mongoErr: any) {
      console.error('MongoDB save error (token endpoint):', mongoErr?.message || mongoErr);
      // Continue even if MongoDB save fails
    }

    // Lấy thông tin phòng từ MongoDB và kiểm tra chủ phòng
    const roomDoc = await StudyRoom.findOne({ roomName: params.roomName }).lean() as IStudyRoom | null;
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Kiểm tra xem có cần chuyển quyền chủ phòng không
    let shouldBeHost = false;
    let isCurrentHost = roomDoc.currentHostId === userId;

    if (!isCurrentHost) {
      // Nếu chủ phòng hiện tại không còn trong phòng, người tạo phòng sẽ lấy lại quyền
      const currentHostId = roomDoc.currentHostId;
      if (currentHostId) {
        try {
          // Check xem chủ phòng hiện tại có còn trong phòng không
          const lkRoom = await lk.listRooms([params.roomName]);
          if (lkRoom && lkRoom.length > 0) {
            const participants = await lk.listParticipants(params.roomName);
            const hostStillInRoom = participants.some((p: any) => p.identity === currentHostId);
            if (!hostStillInRoom) {
              // Chủ phòng không còn trong phòng, ưu tiên người tạo phòng
              // Người tạo phòng luôn được ưu tiên lấy lại quyền khi quay lại
              if (userId === roomDoc.createdBy.id) {
                shouldBeHost = true;
                await StudyRoom.updateOne(
                  { roomName: params.roomName },
                  { $set: { currentHostId: userId } }
                );
              }
              // Nếu không phải người tạo phòng, không tự động set làm chủ phòng ở đây
              // (sẽ được xử lý qua webhook khi chủ phòng rời)
            }
          } else {
            // Phòng không có ai, người tạo phòng sẽ là chủ phòng
            if (userId === roomDoc.createdBy.id) {
              shouldBeHost = true;
              await StudyRoom.updateOne(
                { roomName: params.roomName },
                { $set: { currentHostId: userId } }
              );
            }
          }
        } catch (lkErr: any) {
          console.error('Error checking LiveKit room:', lkErr?.message || lkErr);
          // Nếu không check được, giả sử chủ phòng còn trong phòng
        }
      } else {
        // Chưa có chủ phòng, ưu tiên người tạo phòng
        if (userId === roomDoc.createdBy.id) {
          shouldBeHost = true;
          await StudyRoom.updateOne(
            { roomName: params.roomName },
            { $set: { currentHostId: userId } }
          );
        } else {
          // Nếu không phải người tạo, họ cũng có thể làm chủ phòng nếu không có ai
          shouldBeHost = true;
          await StudyRoom.updateOne(
            { roomName: params.roomName },
            { $set: { currentHostId: userId } }
          );
        }
      }
    }

    // Tất cả user đều có quyền đầy đủ
    const isHost = isCurrentHost || shouldBeHost;
    const userRole = user.role;
    
    // Xác định房主的 identity (sau khi可能已经更新)
    const updatedRoomDoc = await StudyRoom.findOne({ roomName: params.roomName }).lean() as IStudyRoom | null;
    const hostIdentity = updatedRoomDoc?.currentHostId || roomDoc.currentHostId || userId;

    const raw = createJoinToken({
      roomName: params.roomName,
      identity: userId,
      name: user.name,
      role: userRole as 'admin' | 'teacher' | 'student', // Giữ nguyên role nhưng token sẽ có quyền đầy đủ
      ttlSeconds: 60 * 60,
      isHost: true, // Luôn set true để đảm bảo quyền đầy đủ
    });

    // đỡ cả string & Promise (nếu lỡ viết sai ở lib)
    const token: string = await Promise.resolve(raw as any);
    console.log('Issued token typeof=', typeof token, 'len=', token?.length, 'peek=', String(token).slice(0, 16), 'isHost=', isHost);

    return res.json({
      wsUrl: WS_URL_FOR_CLIENT,
      token,
      identity: userId,
      displayName: user.name,
      role: userRole,
      isHost,
      hostIdentity, // 返回房主的 identity
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to issue token' });
  }
});

// GET /api/study-rooms → list persisted rooms (tất cả user đều có thể xem)
router.get('/study-rooms', requireAuth, async (req, res) => {
  // Bỏ giới hạn role - tất cả user đều có thể xem danh sách phòng
  // Không cần filter deletedAt nữa vì đã xóa thực sự
  const docs = await StudyRoom.find({}).sort({ createdAt: -1 }).lean();
  const rooms = await lk.listRooms();
  const map = new Map(rooms.map((r: any) => [r.name, r]));
  const payload = docs.map((d: any) => ({
    roomName: d.roomName,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
    emptySince: d.emptySince,
    numParticipants: map.get(d.roomName)?.numParticipants ?? 0,
  }));
  res.json({ rooms: payload });
});

// DELETE /api/study-rooms/:roomName → delete persisted + LiveKit (admin)
router.delete('/study-rooms/:roomName', requireAuth, async (req, res) => {
  const userId = (req as any).auth?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await User.findById(userId).select("role").lean();
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin' });
  }
  const roomName = req.params.roomName;
  try {
    await lk.deleteRoom(roomName).catch(() => undefined);
    // Xóa thực sự khỏi MongoDB
    await StudyRoom.deleteOne({ roomName });
    console.log(`[deleteStudyRoom] Admin deleted room "${roomName}" from MongoDB`);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, message: 'Failed to delete room' });
  }
});

// DELETE /api/rooms/:roomName → xoá phòng (admin)
router.delete('/rooms/:roomName', requireAuth, async (req, res) => {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await User.findById(userId).select("role").lean();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin' });
    }
    try {
      await lk.deleteRoom(req.params.roomName);
      return res.json({ ok: true });
    } catch (e: any) {
      // LiveKit trả 404 khi phòng không tồn tại
      if (e?.status === 404 || e?.code === 'not_found' || /does not exist/i.test(e?.message || '')) {
        return res.status(404).json({ ok: false, message: 'Room not found' });
      }
      console.error(e);
      return res.status(500).json({ ok: false, message: 'Failed to delete room' });
    }
  });
  

export default router;
// src/routes/studyRooms.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { lk, createJoinToken, WS_URL_FOR_CLIENT } from '../lib/livekit';
import { requireAuth } from '../middleware/auth'; // đúng 'middleware'

const router = Router();

// POST /api/rooms → tạo phòng (teacher/admin)
router.post('/rooms', requireAuth, async (req, res) => {
  try {
    if (req.user!.role === 'student') {
      return res.status(403).json({ message: 'Only teacher/admin can create rooms' });
    }

    const body = z.object({
      roomName: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
      maxParticipants: z.number().int().min(2).max(200).optional(),
      emptyTimeout: z.number().int().min(10).max(3600).optional(),
    }).parse(req.body);

    const room = await lk.createRoom({
      name: body.roomName,
      maxParticipants: body.maxParticipants ?? 50,
      emptyTimeout: body.emptyTimeout ?? 300,

      metadata: JSON.stringify({
        courseId: req.body?.courseId ?? null,
        lessonId: req.body?.lessonId ?? null,
        teacherId: req.user!.id,
      }),
    });

    return res.json({ ok: true, room });
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

    if (err?.message?.includes('already exists')) {
      return res.json({ ok: true, reused: true, roomName: req.body?.roomName });
    }
    return res.status(500).json({ ok: false, message: 'Failed to create room', detail });
  }
});

// POST /api/rooms/:roomName/token → lấy token join
router.post('/rooms/:roomName/token', requireAuth, async (req, res) => {
  try {
    const params = z.object({ roomName: z.string() }).parse(req.params);

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

    const raw = createJoinToken({
      roomName: params.roomName,
      identity: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      ttlSeconds: 60 * 60,
    });

    // đỡ cả string & Promise (nếu lỡ viết sai ở lib)
    const token: string = await Promise.resolve(raw as any);
    console.log('Issued token typeof=', typeof token, 'len=', token?.length, 'peek=', String(token).slice(0, 16));

    return res.json({
      wsUrl: WS_URL_FOR_CLIENT,
      token,
      identity: req.user!.id,
      displayName: req.user!.name,
      role: req.user!.role,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to issue token' });
  }
});

// DELETE /api/rooms/:roomName → xoá phòng (admin)
router.delete('/rooms/:roomName', requireAuth, async (req, res) => {
    if (req.user!.role !== 'admin') {
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
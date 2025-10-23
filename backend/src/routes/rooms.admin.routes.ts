// src/routes/rooms.admin.routes.ts
import { Router } from 'express';
import { lk } from '../lib/livekit';
import { requireAuth } from '../middleware/auth';

const router = Router();

// chỉ teacher/admin mới được quản trị
function ensureStaff(req: any, res: any, next: any) {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Only teacher/admin' });
  }
  next();
}

// GET /api/rooms → liệt kê phòng đang active
router.get('/rooms', requireAuth, ensureStaff, async (_req, res) => {
  const rooms = await lk.listRooms();
  res.json({ rooms });
});

// GET /api/rooms/:room/participants → danh sách người trong phòng
router.get('/rooms/:room/participants', requireAuth, ensureStaff, async (req, res) => {
  const participants = await lk.listParticipants(req.params.room);
  res.json({ participants });
});

// POST /api/rooms/:room/participants/:identity/kick → kick khỏi phòng
router.post('/rooms/:room/participants/:identity/kick', requireAuth, ensureStaff, async (req, res) => {
  await lk.removeParticipant(req.params.room, req.params.identity);
  res.json({ ok: true });
});

// POST /api/rooms/:room/participants/:identity/mute → mute all tracks (hoặc 1 trackSid)
router.post('/rooms/:room/participants/:identity/mute', requireAuth, ensureStaff, async (req, res) => {
  const mute = Boolean(req.body?.mute ?? true);
  const trackSid = String(req.body?.trackSid ?? '');
  await lk.mutePublishedTrack(req.params.room, req.params.identity, trackSid, mute);
  res.json({ ok: true });
});

export default router;

// backend/src/routes/rooms.debug.routes.ts
import { Router } from 'express';
import { RoomSession } from '../models/RoomSession';
import { SessionParticipant } from '../models/SessionParticipant';

const router = Router();

// GET /api/debug/sessions → list 10 session gần nhất
router.get('/debug/sessions', async (_req, res) => {
  const sessions = await RoomSession.find().sort({ createdAt: -1 }).limit(10);
  res.json({ sessions });
});

// GET /api/debug/sessions/:room → list session theo room
router.get('/debug/sessions/:room', async (req, res) => {
  const sessions = await RoomSession.find({ roomName: req.params.room }).sort({ createdAt: -1 }).limit(10);
  res.json({ sessions });
});

// GET /api/debug/session/:id/participants → list participant của 1 session
router.get('/debug/session/:id/participants', async (req, res) => {
  const parts = await SessionParticipant.find({ sessionId: req.params.id }).sort({ createdAt: 1 });
  res.json({ participants: parts });
});

export default router;

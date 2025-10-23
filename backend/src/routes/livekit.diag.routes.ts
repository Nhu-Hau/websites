// src/routes/livekit.diag.routes.ts
import { Router } from 'express';
import { lk } from '../lib/livekit';

const router = Router();

router.get('/_lk/env', (_req, res) => {
  res.json({
    LIVEKIT_HOST: process.env.LIVEKIT_HOST,
    LIVEKIT_WS_URL: process.env.LIVEKIT_WS_URL,
    LIVEKIT_API_KEY_present: Boolean(process.env.LIVEKIT_API_KEY),
    LIVEKIT_API_SECRET_present: Boolean(process.env.LIVEKIT_API_SECRET),
  });
});

router.get('/_lk/ping', async (_req, res) => {
  try {
    const rooms = await lk.listRooms();
    res.json({ ok: true, count: rooms.length });
  } catch (err: any) {
    console.error('LiveKit listRooms error:', {
      message: err?.message, code: err?.code, status: err?.status, data: err?.response?.data
    });
    res.status(500).json({
      ok: false,
      message: err?.message,
      code: err?.code,
      status: err?.status,
      data: err?.response?.data
    });
  }
});

export default router;

// backend/src/routes/livekit.webhook.routes.ts
import { Router } from 'express';
import { RoomSession } from '../models/RoomSession';
import { SessionParticipant } from '../models/SessionParticipant';

const router = Router();

// Tip: nếu muốn verify chữ ký, dùng WebhookReceiver + raw body.
// Ở dev mình bỏ qua verify để test nhanh.

router.post('/livekit/webhook', async (req, res) => {
  try {
    const event = req.body as any;

    switch (event.event) {
      case 'room_started': {
        const { room } = event;
        await RoomSession.create({
          roomName: room.name,
          startedAt: new Date((room.creationTime ?? Date.now() / 1000) * 1000),
          metadata: tryParse(room.metadata),
        });
        break;
      }

      case 'room_finished': {
        const { room } = event;
        await RoomSession.findOneAndUpdate(
          { roomName: room.name, endedAt: { $exists: false } },
          { endedAt: new Date() },
          { sort: { createdAt: -1 } }
        );
        break;
      }

      case 'participant_joined': {
        const { room, participant } = event;
        // đảm bảo luôn có session mở
        const session =
          (await RoomSession.findOne({ roomName: room.name, endedAt: { $exists: false } }).sort({ createdAt: -1 })) ||
          (await RoomSession.create({
            roomName: room.name,
            startedAt: new Date(),
            metadata: tryParse(room?.metadata),
          }));

        await SessionParticipant.updateOne(
          { sessionId: session._id, identity: participant.identity, leftAt: { $exists: false } },
          {
            $setOnInsert: {
              sessionId: session._id,
              identity: participant.identity,
              name: participant.name,
              role: participant.attributes?.role,
              joinedAt: new Date(),
            },
          },
          { upsert: true }
        );
        break;
      }

      case 'participant_left': {
        const { room, participant } = event;
        const session = await RoomSession.findOne({ roomName: room.name, endedAt: { $exists: false } }).sort({
          createdAt: -1,
        });
        if (session) {
          await SessionParticipant.findOneAndUpdate(
            { sessionId: session._id, identity: participant.identity, leftAt: { $exists: false } },
            { leftAt: new Date() }
          );
        }
        break;
      }

      // TODO: egress_started/ended để lưu recording/RTMP nếu dùng
      default:
        // console.log('Unhandled webhook:', event.event);
        break;
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('webhook error:', err?.message || err);
    res.status(500).json({ ok: false });
  }
});

function tryParse(s?: string) {
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export default router;

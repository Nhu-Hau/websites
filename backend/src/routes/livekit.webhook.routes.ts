// backend/src/routes/livekit.webhook.routes.ts
import { Router } from 'express';
import { RoomSession } from '../models/RoomSession';
import { SessionParticipant } from '../models/SessionParticipant';
import { StudyRoom } from '../models/StudyRoom';
import { lk } from '../lib/livekit';

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

        // Xử lý chuyển quyền chủ phòng nếu người rời là chủ phòng hiện tại
        try {
          const roomDoc = await StudyRoom.findOne({ roomName: room.name }).lean();
          if (roomDoc && !Array.isArray(roomDoc) && roomDoc.currentHostId === participant.identity) {
            // Chủ phòng đã rời, tìm người tiếp theo
            let newHostId: string | null = null;

            try {
              // Lấy danh sách participants còn lại trong phòng
              const participants = await lk.listParticipants(room.name);
              
              if (participants && participants.length > 0) {
                // Ưu tiên người tạo phòng nếu họ còn trong phòng
                const creatorInRoom = participants.find((p: any) => p.identity === roomDoc.createdBy?.id);
                if (creatorInRoom && roomDoc.createdBy) {
                  newHostId = roomDoc.createdBy.id;
                } else {
                  // Nếu người tạo phòng không còn, chọn người join sớm nhất
                  // Sắp xếp theo thời gian join (giả sử identity là thứ tự join hoặc dựa vào session)
                  const participantsSorted = participants.sort((a: any, b: any) => {
                    // Ưu tiên teacher/admin
                    const rolePriority: Record<string, number> = { admin: 0, teacher: 1, student: 2 };
                    const aPriority = rolePriority[a.attributes?.role] ?? 2;
                    const bPriority = rolePriority[b.attributes?.role] ?? 2;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    // Nếu cùng role, chọn theo identity (người join trước)
                    return a.identity.localeCompare(b.identity);
                  });
                  newHostId = participantsSorted[0]?.identity || null;
                }
              }
            } catch (lkErr: any) {
              console.error('Error listing participants for host transfer:', lkErr?.message || lkErr);
              // Nếu không lấy được, set null
              newHostId = null;
            }

            // Cập nhật chủ phòng mới
            await StudyRoom.updateOne(
              { roomName: room.name },
              { $set: { currentHostId: newHostId } }
            );

            console.log(`[Host Transfer] Room ${room.name}: ${participant.identity} left, new host: ${newHostId || 'none'}`);
          }
        } catch (hostTransferErr: any) {
          console.error('Error transferring host on participant_left:', hostTransferErr?.message || hostTransferErr);
          // Không throw, chỉ log lỗi để không ảnh hưởng webhook
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

// src/jobs/cleanupRooms.ts
import { lk } from '../lib/livekit';
import { StudyRoom } from '../models/StudyRoom';

const FIVE_MIN_MS = 5 * 60 * 1000; // 5 phút không có ai thì xóa phòng

let timer: NodeJS.Timeout | null = null;

export function startCleanupRooms() {
  if (timer) return; // idempotent

  timer = setInterval(async () => {
    try {
      const [docs, activeRooms] = await Promise.all([
        StudyRoom.find({}).lean(), // Không cần filter deletedAt nữa vì đã xóa thực sự
        lk.listRooms(),
      ]);
      const map = new Map(activeRooms.map((r: any) => [r.name, r]));
      const now = Date.now();

      for (const d of docs) {
        const r = map.get(d.roomName);
        const num = r?.numParticipants ?? 0;

        if (num === 0) {
          if (!d.emptySince) {
            await StudyRoom.updateOne({ roomName: d.roomName }, { $set: { emptySince: new Date() } });
            continue;
          }
          const emptyMs = now - new Date(d.emptySince).getTime();
          if (emptyMs > FIVE_MIN_MS) {
            try { await lk.deleteRoom(d.roomName); } catch {}
            // Xóa thực sự khỏi MongoDB
            await StudyRoom.deleteOne({ roomName: d.roomName });
            console.log(`[cleanupRooms] Deleted room "${d.roomName}" after 5 minutes of being empty`);
          }
        } else {
          // Có người trong phòng, cập nhật lastActivityAt và xóa emptySince
          await StudyRoom.updateOne(
            { roomName: d.roomName },
            { 
              $set: { lastActivityAt: new Date() },
              $unset: { emptySince: 1 }
            }
          );
        }
      }
    } catch (e) {
      // swallow errors to keep timer alive
      console.error('[cleanupRooms] error', e);
    }
  }, 60 * 1000);
}

export function stopCleanupRooms() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}



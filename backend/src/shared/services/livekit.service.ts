// backend/src/shared/services/livekit.service.ts
import { AccessToken, RoomServiceClient, VideoGrant } from 'livekit-server-sdk';

const {
  LIVEKIT_HOST,          // MUST be https://toeic-xxxx.livekit.cloud
  LIVEKIT_WS_URL,        // wss://toeic-xxxx.livekit.cloud (FE join)
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
} = process.env;

if (!LIVEKIT_HOST || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error('Missing LiveKit env: LIVEKIT_HOST / LIVEKIT_API_KEY / LIVEKIT_API_SECRET');
}

// auto-fix nếu lỡ set wss trong LIVEKIT_HOST
const REST_HOST = LIVEKIT_HOST.replace(/^wss:/, 'https:');

export const lk = new RoomServiceClient(REST_HOST, LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!);

export type RoomRole = 'admin' | 'teacher' | 'student';

/**
 * Sanitize name to ensure it's safe for LiveKit (remove/replace problematic characters)
 * LiveKit should handle UTF-8, but we ensure no control characters or overly long names
 */
function sanitizeName(name?: string): string | undefined {
  if (!name) return undefined;
  // Remove control characters and limit length
  // LiveKit JWT can handle UTF-8, so we just ensure no control chars
  return name
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 100); // Limit length to 100 chars
}

// KHÔNG async — toJwt() là sync và trả STRING
export function createJoinToken(opts: {
  roomName: string;
  identity: string;
  name?: string;
  role: RoomRole;
  ttlSeconds?: number;
  isHost?: boolean; // Nếu true, trao quyền roomAdmin (nếu role không phải student)
}) {
  const { roomName, identity, name, role, ttlSeconds = 3600, isHost = false } = opts;

  const at = new AccessToken(LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!, {
    identity,
    name: sanitizeName(name),
    ttl: ttlSeconds,
  });

  // Cho tất cả người dùng quyền đầy đủ
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: true, // Tất cả đều có thể tạo phòng
    roomAdmin: true, // Tất cả đều có quyền admin phòng
  };
  at.addGrant(grant);

  return at.toJwt(); // STRING
}

export const WS_URL_FOR_CLIENT =
  LIVEKIT_WS_URL || REST_HOST.replace(/^https:/, 'wss:');


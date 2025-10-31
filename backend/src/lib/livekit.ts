// src/lib/livekit.ts
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
    name,
    ttl: ttlSeconds,
  });

  // Nếu là chủ phòng và role không phải student, trao quyền admin
  const hasAdminRole = role === 'admin' || (isHost && role !== 'student');

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: role !== 'student',
    roomAdmin: hasAdminRole,
  };
  at.addGrant(grant);

  return at.toJwt(); // STRING
}

export const WS_URL_FOR_CLIENT =
  LIVEKIT_WS_URL || REST_HOST.replace(/^https:/, 'wss:');

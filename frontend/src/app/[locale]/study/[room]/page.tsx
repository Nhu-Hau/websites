// D:\KLTN\websites\frontend\src\app\[locale]\study\[room]\page.tsx
'use client';

import { LiveKitRoom, VideoConference, useParticipants } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type JoinResp = {
  wsUrl: string;
  token: string;
  identity: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
};

function ParticipantCount() {
  const participants = useParticipants();
  return (
    <div className="absolute top-4 right-4 z-50 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
      👥 {participants.length} người
    </div>
  );
}

export default function StudyRoomI18nPage() {
  const p = useParams<{ locale: string; room: string }>();
  const room = String(p?.room ?? '');
  const { user } = useAuth();

  const [data, setData] = useState<JoinResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!room) return;

    const ac = new AbortController();

    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || '';
        const res = await fetch(`${base}/api/rooms/${room}/token`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'x-user-id': user?.id || `guest-${crypto.randomUUID()}`,
            'x-user-name': user?.name || 'Guest',
            'x-user-role': (user?.role as any) || 'student',
          },
          signal: ac.signal,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`${res.status} ${res.statusText}: ${txt || 'no body'}`);
        }
        const json: JoinResp = await res.json();
        setData(json);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.error('join error:', e);
        setErr(e.message || 'Cannot get token');
      }
    })();

    return () => ac.abort();
  }, [room, user?.id, user?.name, user?.role]);

  if (!room) return null;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Đang lấy token…</div>;

  return (
    <div className="pt-16 md:pt-20 min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]">
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        video
        audio
        className="relative h-full"
        onDisconnected={() => console.log('disconnected')}
      >
        <ParticipantCount />
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

export const dynamic = 'force-dynamic';

'use client';

import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type JoinResp = {
  wsUrl: string;
  token: string;
  identity: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
};

export default function StudyRoomI18nPage() {
  const p = useParams<{ locale: string; room: string }>();
  const room = String(p?.room ?? '');

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
            'x-user-id': 'u777',
            'x-user-name': 'Sang',
            'x-user-role': 'student',
          },
          signal: ac.signal,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`${res.status} ${res.statusText}: ${txt || 'no body'}`);
        }
        const json: JoinResp = await res.json();
        setData(json); // <-- QUAN TRỌNG
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.error('join error:', e);
        setErr(e.message || 'Cannot get token');
      }
    })();

    return () => ac.abort();
  }, [room]);

  if (!room) return null;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Đang lấy token…</div>;

  return (
    <LiveKitRoom
      serverUrl={data.wsUrl}
      token={data.token}
      connect
      video
      audio
      className="h-[100dvh]"
      onDisconnected={() => console.log('disconnected')}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

export const dynamic = 'force-dynamic';

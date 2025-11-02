// D:\KLTN\websites\frontend\src\app\[locale]\study\[room]\page.tsx
'use client';

import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  ParticipantTile,
  ControlBar,
  DisconnectButton,
  TrackToggle,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

type JoinResp = {
  wsUrl: string;
  token: string;
  identity: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
  isHost?: boolean;
  hostIdentity?: string; // identity của chủ phòng
};

function ParticipantCount() {
  const participants = useParticipants();
  return (
    <div className="absolute top-4 right-4 z-50 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
      👥 {participants.length} người
    </div>
  );
}

// Component: Hiển thị video chủ phòng
function HostVideo({ hostIdentity }: { hostIdentity: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Tìm chủ phòng (ưu tiên người tham gia cục bộ nếu là chủ phòng, nếu không thì tìm người tham gia từ xa)
  const hostParticipant = useMemo(() => {
    if (localParticipant.identity === hostIdentity) {
      return localParticipant;
    }
    return participants.find((p) => p.identity === hostIdentity);
  }, [participants, hostIdentity, localParticipant]);

  // Lấy video track của chủ phòng
  const videoTracks = useTracks(
    [Track.Source.Camera],
    { onlySubscribed: false }
  );

  // Lấy audio track của chủ phòng
  const audioTracks = useTracks(
    [Track.Source.Microphone],
    { onlySubscribed: false }
  );

  const videoTrack = videoTracks.find((track) => track.participant?.identity === hostIdentity);
  const audioTrack = audioTracks.find((track) => track.participant?.identity === hostIdentity);

  // Sử dụng useEffect để quản lý việc attach và cleanup video track
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoTrack?.publication?.track) return;

    videoTrack.publication.track.attach(videoEl);

    return () => {
      videoTrack.publication.track?.detach(videoEl);
    };
  }, [videoTrack]);

  // Sử dụng useEffect để quản lý việc attach và cleanup audio track
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !audioTrack?.publication?.track) return;

    audioTrack.publication.track.attach(audioEl);

    return () => {
      audioTrack.publication.track?.detach(audioEl);
    };
  }, [audioTrack]);

  if (!hostParticipant) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <p className="text-lg mb-2">Chờ chủ phòng tham gia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Element audio để phát âm thanh của chủ phòng */}
      {audioTrack?.publication?.track && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      )}
      {videoTrack?.publication?.track ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted={false}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <p className="text-lg mb-2">{hostParticipant.name || hostParticipant.identity}</p>
            <p className="text-sm text-gray-400">Camera chưa bật</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Thanh điều khiển của chủ phòng
function HostControls({ isHost }: { isHost: boolean }) {
  if (!isHost) {
    return null;
  }

  return (
    <ControlBar className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <TrackToggle source={Track.Source.Camera} />
      <TrackToggle source={Track.Source.Microphone} />
      <DisconnectButton />
    </ControlBar>
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
        // Encode user name to base64 to handle non-ISO-8859-1 characters
        const userName = user?.name || 'Guest';
        let encodedName: string;
        try {
          encodedName = btoa(unescape(encodeURIComponent(userName)));
        } catch (e) {
          console.warn('Failed to encode name, using fallback:', e);
          encodedName = btoa(userName);
        }
        
        const res = await fetch(`${base}/api/rooms/${room}/token`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'x-user-id': user?.id || `guest-${crypto.randomUUID()}`,
            'x-user-name': encodedName,
            'x-user-name-encoded': 'base64', // Flag to indicate encoding
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

  const isHost = data.isHost ?? false;
  const hostIdentity = data.hostIdentity || data.identity; // Sử dụng hostIdentity từ backend trả về, nếu không có thì sử dụng identity của người dùng hiện tại

  return (
    <div className="pt-16 md:pt-20 min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]">
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        video={isHost} // Chỉ chủ phòng mới bật video
        audio={isHost} // Chỉ chủ phòng mới bật audio
        className="relative h-full"
        onDisconnected={() => console.log('disconnected')}
      >
        <ParticipantCount />
        {hostIdentity ? (
          <>
            <HostVideo hostIdentity={hostIdentity} />
            <HostControls isHost={isHost} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-black text-white">
            <div className="text-center">
              <p className="text-lg mb-2">Đang tải phòng live...</p>
            </div>
          </div>
        )}
      </LiveKitRoom>
    </div>
  );
}

export const dynamic = 'force-dynamic';

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
  hostIdentity?: string; // 房主的 identity
};

function ParticipantCount() {
  const participants = useParticipants();
  return (
    <div className="absolute top-4 right-4 z-50 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
      👥 {participants.length} người
    </div>
  );
}

// 组件：显示房主视频
function HostVideo({ hostIdentity }: { hostIdentity: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 找到房主（优先本地参与者如果是房主，否则找远程参与者）
  const hostParticipant = useMemo(() => {
    if (localParticipant.identity === hostIdentity) {
      return localParticipant;
    }
    return participants.find((p) => p.identity === hostIdentity);
  }, [participants, hostIdentity, localParticipant]);

  // 获取房主的视频轨道
  const videoTracks = useTracks(
    [Track.Source.Camera],
    { onlySubscribed: false }
  );

  // 获取房主的音频轨道
  const audioTracks = useTracks(
    [Track.Source.Microphone],
    { onlySubscribed: false }
  );

  const videoTrack = videoTracks.find((track) => track.participant?.identity === hostIdentity);
  const audioTrack = audioTracks.find((track) => track.participant?.identity === hostIdentity);

  // 使用 useEffect 来管理视频轨道的附加和清理
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoTrack?.publication?.track) return;

    videoTrack.publication.track.attach(videoEl);

    return () => {
      videoTrack.publication.track?.detach(videoEl);
    };
  }, [videoTrack]);

  // 使用 useEffect 来管理音频轨道的附加和清理
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
      {/* 音频元素，用于播放房主的音频 */}
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

// 组件：房主控制栏
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

  const isHost = data.isHost ?? false;
  const hostIdentity = data.hostIdentity || data.identity; // 使用后端返回的 hostIdentity，如果没有则使用当前用户的 identity

  return (
    <div className="pt-16 md:pt-20 min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]">
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        video={isHost} // 只有房主才开启视频
        audio={isHost} // 只有房主才开启音频
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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  ParticipantTile,
  TrackToggle,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track, LocalVideoTrack } from "livekit-client";
import "@livekit/components-styles";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  Radio,
  Signal,
  Crown,
  LogOut,
  Loader2,
  Monitor,
  MonitorOff,
  Ban,
  Heart,
  ThumbsUp,
} from "lucide-react";
import ChatPanel from "@/components/study/ChatPanel";
import { useBasePrefix } from "@/hooks/useBasePrefix";
import Swal from "sweetalert2";

type JoinResp = {
  wsUrl: string;
  token: string;
  identity: string;
  displayName: string;
  role: "student" | "teacher" | "admin";
  isHost?: boolean;
  hostIdentity?: string;
};

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}

function formatViewers(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}


function LeaveRoomButton() {
  const room = useRoomContext();
  const router = useRouter();
  const basePrefix = useBasePrefix("vi");

  const leave = async () => {
    try {
      await room?.disconnect?.();
    } catch {
      // ignore
    } finally {
      router.replace(`${basePrefix}/study/create`);
    }
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && leave();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <button
      onClick={leave}
      className="absolute top-4 left-4 z-40 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition"
      aria-label="Rời phòng"
    >
      <LogOut className="w-4 h-4 text-rose-600" />
      <span className="text-zinc-900 dark:text-zinc-100">Rời phòng</span>
      <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
        (Esc)
      </span>
    </button>
  );
}

function HostTile({ hostIdentity }: { hostIdentity: string }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const hostP = useMemo(() => {
    if (localParticipant?.identity === hostIdentity) return localParticipant;
    return participants.find((p) => p.identity === hostIdentity);
  }, [hostIdentity, localParticipant, participants]);

  // lấy camera/mic/screen track theo identity host
  const camRefs = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const micRefs = useTracks([Track.Source.Microphone], {
    onlySubscribed: false,
  });
  const screenRefs = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const camRef = useMemo(
    () => camRefs.find((r) => r.participant?.identity === hostIdentity),
    [camRefs, hostIdentity]
  );
  const micRef = useMemo(
    () => micRefs.find((r) => r.participant?.identity === hostIdentity),
    [micRefs, hostIdentity]
  );
  const screenRef = useMemo(
    () => screenRefs.find((r) => r.participant?.identity === hostIdentity),
    [screenRefs, hostIdentity]
  );

  if (!hostP) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-6rem)] bg-gradient-to-br from-zinc-900 to-black text-white">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800">
            <Crown className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-lg font-medium">Đang chờ chủ phòng…</p>
          <p className="text-sm text-zinc-400">
            Khi giáo viên tham gia, video sẽ hiển thị ở đây.
          </p>
        </div>
      </div>
    );
  }

  const nameLabel = hostP.name || hostP.identity || "Host";
  const hasCam = !!camRef;
  const hasMic = !!micRef;

  return (
    <div className="relative w-full min-h-[calc(100dvh-6rem)] bg-black overflow-hidden">
      {/* Screen share hoặc Video host - ưu tiên screen share */}
      <div className="w-full h-[calc(100dvh-6rem)] relative">
        {screenRef ? (
          <VideoTrack
            trackRef={screenRef}
            className="w-full h-full [&_video]:object-contain"
          />
        ) : camRef ? (
          <VideoTrack
            trackRef={camRef}
            className="w-full h-full [&_video]:object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto ring-1 ring-white/10">
                <span className="text-2xl font-bold">
                  {(
                    nameLabel
                      .split(" ")
                      .slice(0, 2)
                      .map((s) => s[0])
                      .join("") || "U"
                  ).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium">{nameLabel}</p>
              <p className="text-xs text-zinc-400 flex items-center gap-1 justify-center">
                <VideoOff className="w-4 h-4" /> Camera chưa bật
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay: tên + trạng thái */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white shadow-lg border border-white/10">
        <Crown className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium">{nameLabel}</span>
        <span className="mx-1.5 opacity-50">•</span>
        <span className="text-xs flex items-center gap-2 opacity-90">
          {hasCam ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <VideoOff className="w-3.5 h-3.5" />
          )}
          {hasMic ? (
            <Mic className="w-3.5 h-3.5" />
          ) : (
            <MicOff className="w-3.5 h-3.5" />
          )}
        </span>
      </div>

      {/* Góc phải: icon trạng thái */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 text-white border border-white/10">
        <Radio className="w-4 h-4 opacity-90" />
        <Signal className="w-4 h-4 opacity-90" />
      </div>
    </div>
  );
}

// Host controls với screen sharing
function HostControls({ roomName }: { roomName: string }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<LocalVideoTrack | null>(null);

  const toggleScreenShare = useCallback(async () => {
    if (!room || !localParticipant) return;

    try {
      if (isSharing && screenTrack) {
        // Stop screen sharing
        await localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        setScreenTrack(null);
        setIsSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        
        const videoTrack = stream.getVideoTracks()[0];
        
        if (videoTrack) {
          // Create LiveKit track from MediaStreamTrack
          const screenTrack = new LocalVideoTrack(videoTrack);
          await localParticipant.publishTrack(screenTrack, { source: Track.Source.ScreenShare });
          setScreenTrack(screenTrack);
          setIsSharing(true);
          
          // Stop when user stops sharing in browser
          videoTrack.onended = async () => {
            if (screenTrack) {
              await localParticipant.unpublishTrack(screenTrack);
              screenTrack.stop();
              setScreenTrack(null);
              setIsSharing(false);
            }
          };
        }
      }
    } catch (e: any) {
      console.error("Screen share error:", e);
      toast.error("Không thể chia sẻ màn hình", { description: e?.message });
    }
  }, [room, localParticipant, isSharing, screenTrack]);

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 shadow-2xl">
        <TrackToggle
          source={Track.Source.Camera}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        />
        <TrackToggle
          source={Track.Source.Microphone}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        />
        <button
          onClick={toggleScreenShare}
          className={`inline-flex items-center justify-center w-11 h-11 rounded-xl transition ${
            isSharing
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
          title={isSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        >
          {isSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

// Participants list với kick button
function ParticipantsList({ roomName }: { roomName: string }) {
  const participants = useParticipants();
  const { user } = useAuth();
  const [showList, setShowList] = useState(false);

  const handleKick = useCallback(async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: "Xác nhận",
      text: `Bạn có chắc muốn kick "${userName}" khỏi phòng?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, kick",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, reason: "Bị kick bởi giáo viên/quản trị viên" }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Kick thất bại");
        return;
      }
      toast.success(`Đã kick "${userName}" khỏi phòng`);
    } catch (e: any) {
      toast.error("Kick thất bại");
      console.error("Failed to kick:", e);
    }
  }, [roomName]);

  return (
    <div className="absolute top-4 right-4 z-40">
      <button
        onClick={() => setShowList(!showList)}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition"
      >
        <Users className="w-4 h-4" />
        <span>{participants.length}</span>
      </button>
      
      {showList && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-xl p-3 max-h-96 overflow-y-auto">
          <div className="text-xs font-semibold mb-2 text-zinc-600 dark:text-zinc-400">
            Người tham gia ({participants.length})
          </div>
          <div className="space-y-1">
            {participants.map((p) => {
              const isMe = p.identity === user?.id;
              return (
                <div
                  key={p.identity}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="text-sm truncate flex-1">
                    {p.name || p.identity} {isMe && "(Bạn)"}
                  </span>
                  {!isMe && (
                    <button
                      onClick={() => handleKick(p.identity, p.name || p.identity)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                      title="Kick"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Heart reaction
function HeartReaction({ roomName }: { roomName: string }) {
  const room = useRoomContext();
  const [hearts, setHearts] = useState<Array<{ id: string; x: number; y: number; timestamp: number }>>([]);

  useEffect(() => {
    if (!room) return;

    const onData = (payload: Uint8Array, participant?: any, _kind?: any, topic?: string) => {
      if (topic !== "heart") return;
      
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === "heart") {
          setHearts(prev => [...prev, {
            id: crypto.randomUUID(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            timestamp: Date.now(),
          }]);
        }
      } catch {
        // ignore
      }
    };

    room.on("dataReceived" as any, onData);
    return () => {
      room.off("dataReceived" as any, onData);
    };
  }, [room]);

  // Remove old hearts
  useEffect(() => {
    const interval = setInterval(() => {
      setHearts(prev => prev.filter(h => Date.now() - h.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendHeart = useCallback(() => {
    if (!room) return;
    
    try {
      const bytes = new TextEncoder().encode(JSON.stringify({ type: "heart" }));
      room.localParticipant.publishData(bytes, { reliable: false, topic: "heart" });
      
      // Add local heart
      setHearts(prev => [...prev, {
        id: crypto.randomUUID(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        timestamp: Date.now(),
      }]);
    } catch (e) {
      console.error("Failed to send heart:", e);
    }
  }, [room]);

  return (
    <>
      <button
        onClick={sendHeart}
        className="absolute bottom-20 right-4 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 hover:scale-110 transition-all"
        title="Thả tim"
      >
        <Heart className="w-6 h-6 fill-current" />
      </button>
      
      {/* Floating hearts */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute animate-bounce"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              animation: "float-up 3s ease-out forwards",
            }}
          >
            <Heart className="w-8 h-8 text-rose-500 fill-current" />
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
        }
      `}</style>
    </>
  );
}

// Like reaction
function LikeReaction({ roomName }: { roomName: string }) {
  const room = useRoomContext();
  const [likes, setLikes] = useState<Array<{ id: string; x: number; y: number; timestamp: number }>>([]);

  useEffect(() => {
    if (!room) return;

    const onData = (payload: Uint8Array, participant?: any, _kind?: any, topic?: string) => {
      if (topic !== "like") return;
      
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === "like") {
          setLikes(prev => [...prev, {
            id: crypto.randomUUID(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            timestamp: Date.now(),
          }]);
        }
      } catch {
        // ignore
      }
    };

    room.on("dataReceived" as any, onData);
    return () => {
      room.off("dataReceived" as any, onData);
    };
  }, [room]);

  // Remove old likes
  useEffect(() => {
    const interval = setInterval(() => {
      setLikes(prev => prev.filter(l => Date.now() - l.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendLike = useCallback(() => {
    if (!room) return;
    
    try {
      const bytes = new TextEncoder().encode(JSON.stringify({ type: "like" }));
      room.localParticipant.publishData(bytes, { reliable: false, topic: "like" });
      
      // Add local like
      setLikes(prev => [...prev, {
        id: crypto.randomUUID(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        timestamp: Date.now(),
      }]);
    } catch (e) {
      console.error("Failed to send like:", e);
    }
  }, [room]);

  return (
    <>
      <button
        onClick={sendLike}
        className="absolute bottom-32 right-4 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-110 transition-all"
        title="Thả like"
      >
        <ThumbsUp className="w-6 h-6 fill-current" />
      </button>
      
      {/* Floating likes */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {likes.map((like) => (
          <div
            key={like.id}
            className="absolute animate-bounce"
            style={{
              left: `${like.x}%`,
              top: `${like.y}%`,
              animation: "float-up 3s ease-out forwards",
            }}
          >
            <ThumbsUp className="w-8 h-8 text-blue-500 fill-current" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function StudyRoomPage() {
  const params = useParams<{ locale?: string; room?: string }>();
  const room = String(params?.room ?? "");
  const { user } = useAuth();

  const [data, setData] = useState<JoinResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = user?.id;
  const uname = user?.name;
  const urole = user?.role as JoinResp["role"] | undefined;

  const fetchToken = useCallback(
    async (signal?: AbortSignal) => {
      if (!room) return;
      setLoading(true);
      setErr(null);

      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
        /\/+$/,
        ""
      );
      const name = uname || "Guest";
      let encodedName = "";
      try {
        encodedName = btoa(unescape(encodeURIComponent(name)));
      } catch {
        encodedName = btoa(name);
      }

      const doFetch = async () => {
        const res = await fetch(
          `${base}/api/rooms/${encodeURIComponent(room)}/token`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "x-user-id":
                uid ||
                `guest-${
                  typeof crypto !== "undefined"
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2)
                }`,
              "x-user-name": encodedName,
              "x-user-name-encoded": "base64",
              "x-user-role": urole || "student",
            },
            signal,
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `${res.status} ${res.statusText}: ${txt || "no body"}`
          );
        }
        return (await res.json()) as JoinResp;
      };

      try {
        // retry 3 lần: 0ms, 600ms, 1500ms
        let lastErr: any = null;
        for (const delay of [0, 600, 1500]) {
          if (delay) await wait(delay);
          try {
            const json = await doFetch();
            setData(json);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (lastErr) throw lastErr;
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          const msg = e?.message || "Không thể lấy token tham gia phòng.";
          setErr(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [room, uid, uname, urole]
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchToken(ac.signal);
    return () => ac.abort();
  }, [fetchToken]);

  if (!room) return null;

  if (err) {
    return (
      <div className="pt-16 md:pt-20 min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border border-rose-200/60 bg-rose-50 p-6 text-rose-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Không thể vào phòng</h2>
          </div>
          <p className="text-sm mb-4">{err}</p>
          <button
            onClick={() => fetchToken()}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="pt-16 md:pt-20 min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Đang kết nối phòng…
          </p>
        </div>
      </div>
    );
  }

  const isHost = !!data.isHost;
  const hostIdentity = data.hostIdentity || data.identity;

  return (
    <div className="pt-16 md:pt-20 min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        video={isHost}
        audio={isHost}
        connectOptions={{ 
          autoSubscribe: true,
        }}
        className="relative h-full"
        onDisconnected={() => toast.message("Bạn đã rời phòng")}
      >
        {/* ✅ SDK tự render toàn bộ audio, ổn định, không giật */}
        <RoomAudioRenderer />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_360px]">
          {/* Cột trái: Video/Host */}
          <div className="relative">
            <LeaveRoomButton />
            <HostTile hostIdentity={hostIdentity} />
            {/* Host controls: chỉ hiện khi là host */}
            {isHost && (
              <HostControls roomName={room} />
            )}
            
            {/* Participants list với kick button (teacher/admin only) */}
            {(user?.role === "teacher" || user?.role === "admin") && (
              <ParticipantsList roomName={room} />
            )}
            
            {/* Heart và Like reaction buttons */}
            <HeartReaction roomName={room} />
            <LikeReaction roomName={room} />
          </div>

          {/* Cột phải: Chat */}
          <ChatPanel
            me={{
              id: data.identity,
              name: data.displayName || "Guest",
              role: data.role || "student",
            }}
            roomName={room}
            isHost={isHost}
            hostIdentity={hostIdentity}
          />
        </div>
      </LiveKitRoom>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
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
import ChatPanel from "@/components/features/study/ChatPanel";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
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
  }, [leave]);

  return (
    <button
      onClick={leave}
      className="group absolute top-4 left-4 z-50 inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-black bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border-2 border-white/30 dark:border-zinc-700/50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 ring-2 ring-white/20 dark:ring-zinc-800/50"
      aria-label="Rời phòng"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <LogOut className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 relative z-10 transition-transform group-hover:translate-x-0.5" />
      <span className="text-zinc-900 dark:text-white relative z-10">Rời phòng</span>
      <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 relative z-10">
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

  const camRefs = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const micRefs = useTracks([Track.Source.Microphone], { onlySubscribed: false });
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
      <div className="flex items-center justify-center h-[calc(100dvh-6rem)] bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white">
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl ring-4 ring-white/10 dark:ring-zinc-700/50">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/40 to-indigo-400/40 blur-xl animate-pulse" />
            <Crown className="h-12 w-12 text-white relative z-10" />
          </div>
          <p className="text-xl font-black text-white">Đang chờ chủ phòng…</p>
          <p className="text-sm font-medium text-zinc-400">
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
            <div className="text-center space-y-3">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mx-auto shadow-2xl ring-4 ring-white/10">
                <span className="text-3xl font-black text-zinc-300">
                  {initials(nameLabel)}
                </span>
              </div>
              <p className="text-lg font-black">{nameLabel}</p>
              <p className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 justify-center">
                <VideoOff className="w-4.5 h-4.5" /> Camera chưa bật
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay: tên + trạng thái */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/80 dark:bg-zinc-900/80 backdrop-blur-xl text-white shadow-2xl border-2 border-white/20 dark:border-zinc-700/50 ring-2 ring-white/10 dark:ring-zinc-700/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg ring-2 ring-white/30">
          <Crown className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-black">{nameLabel}</span>
        <span className="mx-2 opacity-60">•</span>
        <span className="text-xs flex items-center gap-2.5 font-medium">
          {hasCam ? (
            <Video className="w-4 h-4 text-emerald-400" />
          ) : (
            <VideoOff className="w-4 h-4 text-rose-400" />
          )}
          {hasMic ? (
            <Mic className="w-4 h-4 text-emerald-400" />
          ) : (
            <MicOff className="w-4 h-4 text-rose-400" />
          )}
        </span>
      </div>

      {/* Góc phải: icon trạng thái */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 dark:bg-zinc-900/70 backdrop-blur-md text-white border border-white/10 dark:border-zinc-700/50">
        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        <Signal className="w-4 h-4 text-emerald-400" />
      </div>
    </div>
  );
}

function HostControls({ }: { roomName: string }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<LocalVideoTrack | null>(null);

  const toggleScreenShare = useCallback(async () => {
    if (!room || !localParticipant) return;

    try {
      if (isSharing && screenTrack) {
        await localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        setScreenTrack(null);
        setIsSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        
        const videoTrack = stream.getVideoTracks()[0];
        
        if (videoTrack) {
          const screenTrack = new LocalVideoTrack(videoTrack);
          await localParticipant.publishTrack(screenTrack, { source: Track.Source.ScreenShare });
          setScreenTrack(screenTrack);
          setIsSharing(true);
          
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
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="group relative pointer-events-auto flex items-center gap-3 rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border-2 border-white/30 dark:border-zinc-700/50 px-4 py-3 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
        
        <TrackToggle
          source={Track.Source.Camera}
          className="group relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
        />
        <TrackToggle
          source={Track.Source.Microphone}
          className="group relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
        />
        <button
          onClick={toggleScreenShare}
          className={`group relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 ${
            isSharing
              ? "bg-gradient-to-br from-rose-500 to-red-600 text-white hover:from-rose-400 hover:to-red-500"
              : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30"
          }`}
          title={isSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        >
          {isSharing ? (
            <MonitorOff className="w-5.5 h-5.5 transition-transform group-hover:scale-110" />
          ) : (
            <Monitor className="w-5.5 h-5.5 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>
    </div>
  );
}

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
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={() => setShowList(!showList)}
        className="group relative inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-black bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border-2 border-white/30 dark:border-zinc-700/50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 ring-2 ring-white/20 dark:ring-zinc-800/50 overflow-hidden"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 relative z-10 transition-transform group-hover:scale-110" />
        <span className="text-zinc-900 dark:text-white relative z-10">{participants.length}</span>
      </button>
      
      {showList && (
        <div className="group absolute top-full right-0 mt-3 w-72 rounded-3xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl border-2 border-white/30 dark:border-zinc-700/50 shadow-2xl p-4 max-h-96 overflow-y-auto ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:ring-blue-300/50 dark:hover:ring-blue-600/50">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative text-sm font-black mb-3 text-zinc-700 dark:text-zinc-300">
            Người tham gia ({participants.length})
          </div>
          <div className="relative space-y-2">
            {participants.map((p) => {
              const isMe = p.identity === user?.id;
              return (
                <div
                  key={p.identity}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50"
                >
                  <span className="text-sm font-medium truncate flex-1 text-zinc-900 dark:text-zinc-100">
                    {p.name || p.identity} {isMe && <span className="text-blue-600 dark:text-blue-400 font-black">(Bạn)</span>}
                  </span>
                  {!isMe && (
                    <button
                      onClick={() => handleKick(p.identity, p.name || p.identity)}
                      className="group/kick p-2 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all duration-300 hover:scale-110"
                      title="Kick"
                    >
                      <Ban className="w-4.5 h-4.5 transition-transform group-hover/kick:rotate-12" />
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

function HeartReaction({ }: { roomName: string }) {
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
      } catch {}
    };

    room.on("dataReceived" as any, onData);
    return () => {
      room.off("dataReceived" as any, onData);
    };
  }, [room]);

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
        className="group absolute bottom-20 right-4 z-50 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl hover:from-rose-400 hover:to-pink-500 hover:scale-110 transition-all duration-300"
        title="Thả tim"
      >
        <Heart className="w-7 h-7 fill-current transition-transform group-hover:scale-125" />
      </button>
      
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
            <Heart className="w-9 h-9 text-rose-500 fill-current drop-shadow-lg" />
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
            transform: translateY(-120px) scale(0.4);
          }
        }
      `}</style>
    </>
  );
}

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
      } catch {}
    };

    room.on("dataReceived" as any, onData);
    return () => {
      room.off("dataReceived" as any, onData);
    };
  }, [room]);

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
        className="group absolute bottom-32 right-4 z-50 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-2xl hover:from-blue-400 hover:to-cyan-500 hover:scale-110 transition-all duration-300"
        title="Thả like"
      >
        <ThumbsUp className="w-7 h-7 fill-current transition-transform group-hover:scale-125 group-hover:rotate-12" />
      </button>
      
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
            <ThumbsUp className="w-9 h-9 text-blue-500 fill-current drop-shadow-lg" />
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

      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
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
              "x-user-id": uid || `guest-${crypto.randomUUID()}`,
              "x-user-name": encodedName,
              "x-user-name-encoded": "base64",
              "x-user-role": urole || "student",
            },
            signal,
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}: ${txt || "no body"}`);
        }
        return (await res.json()) as JoinResp;
      };

      try {
        let lastErr: any = null;
        for (const delay of [0, 600, 1500]) {
          if (delay) await new Promise(r => setTimeout(r, delay));
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
      <div className="pt-16 md:pt-20 min-h-[60vh] flex items-center justify-center bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-6 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-rose-300/50 dark:hover:ring-rose-600/50 overflow-hidden max-w-md mx-4">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Không thể vào phòng</h2>
          </div>
          <p className="text-sm font-medium mb-5 text-zinc-700 dark:text-zinc-300">{err}</p>
          <button
            onClick={() => fetchToken()}
            className="group inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Loader2 className="w-4.5 h-4.5 animate-spin transition-transform group-hover:scale-110" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="pt-16 md:pt-20 min-h-[60vh] grid place-items-center bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50 mx-auto">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <p className="text-lg font-black text-zinc-700 dark:text-zinc-300">
              Đang kết nối phòng…
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isHost = !!data.isHost;
  const hostIdentity = data.hostIdentity || data.identity;

  return (
    <div className="pt-16 md:pt-20 min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        video={isHost}
        audio={isHost}
        connectOptions={{ autoSubscribe: true }}
        className="relative h-full"
        onDisconnected={() => toast.message("Bạn đã rời phòng")}
      >
        <RoomAudioRenderer />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_360px]">
          <div className="relative">
            <LeaveRoomButton />
            <HostTile hostIdentity={hostIdentity} />
            {isHost && <HostControls roomName={room} />}
            {(user?.role === "teacher" || user?.role === "admin") && (
              <ParticipantsList roomName={room} />
            )}
            <HeartReaction roomName={room} />
            <LikeReaction roomName={room} />
          </div>

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
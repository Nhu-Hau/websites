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
import { toast } from "@/lib/toast";
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
  MessageSquare,
} from "lucide-react";
import ChatPanel from "@/components/features/study/ChatPanel";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useConfirmModal } from "@/components/common/ConfirmModal";

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
  const basePrefix = useBasePrefix();

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
      className="
        absolute top-4 left-4 z-40
        inline-flex h-10 w-10 items-center justify-center
        rounded-full border border-zinc-300 bg-white
        text-sm font-medium text-zinc-700 shadow-sm
        transition-colors duration-200 hover:bg-zinc-50
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800

        md:h-auto md:w-auto md:gap-2 md:rounded-lg md:px-3 md:py-2
      "
      aria-label="Rời phòng"
    >
      <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
      {/* text ẩn trên mobile, hiện từ md trở lên */}
      <span className="hidden md:inline">Rời phòng</span>
      {/* (Esc) chỉ hiện trên màn hình lớn hơn (lg) */}
      <span className="ml-1 hidden text-xs text-zinc-500 dark:text-zinc-500 lg:inline">
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
  const micRefs = useTracks([Track.Source.Microphone], {
    onlySubscribed: false,
  });
  const screenRefs = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

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
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-sky-600">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-white">
            Đang chờ chủ phòng…
          </p>
          <p className="text-sm text-zinc-400">
            Khi giáo viên tham gia, video sẽ hiển thị ở đây.
          </p>
        </div>
      </div>
    );
  }

  const nameLabel = hostP.name || hostP.identity || "Host";

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {screenRef ? (
        <VideoTrack
          trackRef={screenRef || camRef}
          className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&_video]:scale-[1.03]"
        />
      ) : camRef ? (
        <VideoTrack
          trackRef={camRef}
          className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-800">
              <span className="text-2xl font-semibold text-zinc-300">
                {initials(nameLabel)}
              </span>
            </div>
            <p className="text-base font-semibold">{nameLabel}</p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-400">
              <VideoOff className="h-4 w-4" /> Camera chưa bật
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function HostControls() {
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
          const st = new LocalVideoTrack(videoTrack);
          await localParticipant.publishTrack(st, {
            source: Track.Source.ScreenShare,
          });
          setScreenTrack(st);
          setIsSharing(true);

          videoTrack.onended = async () => {
            if (st) {
              await localParticipant.unpublishTrack(st);
              st.stop();
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
    <div className="pointer-events-none absolute left-4 bottom-4 z-40">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/70 px-3 shadow-lg backdrop-blur-md">
        {/* Camera */}
        <TrackToggle
          source={Track.Source.Camera}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/15 transition-colors duration-200"
        />

        {/* Mic */}
        <TrackToggle
          source={Track.Source.Microphone}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/15 transition-colors duration-200"
        />

        {/* Share screen */}
        <button
          onClick={toggleScreenShare}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-200 ${
            isSharing
              ? "border-red-500 bg-red-600 text-white hover:bg-red-700"
              : "border-white/20 bg-white/5 text-black hover:bg-white/15"
          }`}
          title={isSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        >
          {isSharing ? (
            <MonitorOff className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
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
  const { show, Modal: ConfirmModal } = useConfirmModal();
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleKick = useCallback(
    async (userId: string, userName: string) => {
      show(
        {
          title: "Xác nhận",
          message: `Bạn có chắc muốn kick "${userName}" khỏi phòng?`,
          icon: "warning",
          confirmText: "Có, kick",
          cancelText: "Hủy",
          confirmColor: "red",
        },
        async () => {
          try {
            const res = await fetch(
              `/api/rooms/${encodeURIComponent(roomName)}/kick`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  userId,
                  reason: "Bị kick bởi giáo viên/quản trị viên",
                }),
              }
            );
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
        }
      );
    },
    [roomName, show]
  );

  // Click outside để đóng panel
  useEffect(() => {
    if (!showList) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setShowList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showList]);

  return (
    <div ref={listRef} className="absolute top-4 right-4 z-40">
      <button
        onClick={() => setShowList(!showList)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Users className="h-4 w-4" />
        <span>{participants.length}</span>
      </button>

      {showList && (
        <div className="absolute top-full right-0 mt-2 max-h-96 w-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Người tham gia ({participants.length})
          </div>
          <div className="space-y-1">
            {participants.map((p) => {
              const isMe = p.identity === user?.id;
              return (
                <div
                  key={p.identity}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {p.name || p.identity}{" "}
                    {isMe && (
                      <span className="font-medium text-sky-600 dark:text-sky-400">
                        (Bạn)
                      </span>
                    )}
                  </span>
                  {!isMe && (
                    <button
                      onClick={() =>
                        handleKick(p.identity, p.name || p.identity)
                      }
                      className="rounded-lg p-1.5 text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Kick"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ConfirmModal}
    </div>
  );
}

function HeartReaction() {
  const room = useRoomContext();
  const [hearts, setHearts] = useState<
    Array<{ id: string; x: number; y: number; timestamp: number }>
  >([]);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (!room) return;

    const onData = (
      payload: Uint8Array,
      _participant?: any,
      _kind?: any,
      topic?: string
    ) => {
      if (topic !== "heart") return;

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === "heart") {
          setHearts((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              x: Math.random() * 100,
              y: Math.random() * 100,
              timestamp: Date.now(),
            },
          ]);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setHearts((prev) => prev.filter((h) => Date.now() - h.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showFullscreen) {
      const timer = setTimeout(() => {
        setShowFullscreen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showFullscreen]);

  const sendHeart = useCallback(() => {
    if (!room) return;

    try {
      const bytes = new TextEncoder().encode(JSON.stringify({ type: "heart" }));
      room.localParticipant.publishData(bytes, {
        reliable: false,
        topic: "heart",
      });

      setHearts((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          timestamp: Date.now(),
        },
      ]);

      // Hiển thị icon toàn màn hình
      setShowFullscreen(true);
    } catch (e) {
      console.error("Failed to send heart:", e);
    }
  }, [room]);

  return (
    <>
      {/* Nút tim nằm trong cụm reaction (vị trí sẽ do wrapper ngoài quyết định) */}
      <button
        onClick={sendHeart}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200"
        title="Thả tim"
      >
        <Heart className="h-5 w-5 fill-current" />
      </button>

      {/* Icon toàn màn hình rực rỡ */}
      {showFullscreen && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="heart-fullscreen-animation">
            <Heart className="h-64 w-64 fill-current text-red-500" />
          </div>
        </div>
      )}

      {/* Animation bay trên màn hình */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              animation: "float-up 3s ease-out forwards",
            }}
          >
            <Heart className="h-8 w-8 fill-current text-red-500 drop-shadow-lg" />
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
        .heart-fullscreen-animation {
          animation: heart-burst 1.5s ease-out forwards;
        }
        @keyframes heart-burst {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
            filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0));
          }
          20% {
            opacity: 1;
            transform: scale(1.2) rotate(5deg);
            filter: drop-shadow(0 0 40px rgba(239, 68, 68, 0.8))
              drop-shadow(0 0 80px rgba(239, 68, 68, 0.6))
              drop-shadow(0 0 120px rgba(239, 68, 68, 0.4));
          }
          40% {
            transform: scale(1) rotate(-2deg);
            filter: drop-shadow(0 0 60px rgba(239, 68, 68, 0.9))
              drop-shadow(0 0 120px rgba(239, 68, 68, 0.7))
              drop-shadow(0 0 180px rgba(239, 68, 68, 0.5));
          }
          60% {
            transform: scale(1.1) rotate(1deg);
            filter: drop-shadow(0 0 50px rgba(239, 68, 68, 0.8))
              drop-shadow(0 0 100px rgba(239, 68, 68, 0.6))
              drop-shadow(0 0 150px rgba(239, 68, 68, 0.4));
          }
          100% {
            opacity: 0;
            transform: scale(1.3) rotate(0deg);
            filter: drop-shadow(0 0 100px rgba(239, 68, 68, 0.3))
              drop-shadow(0 0 200px rgba(239, 68, 68, 0.2));
          }
        }
      `}</style>
    </>
  );
}

function LikeReaction() {
  const room = useRoomContext();
  const [likes, setLikes] = useState<
    Array<{ id: string; x: number; y: number; timestamp: number }>
  >([]);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (!room) return;

    const onData = (
      payload: Uint8Array,
      _participant?: any,
      _kind?: any,
      topic?: string
    ) => {
      if (topic !== "like") return;

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.type === "like") {
          setLikes((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              x: Math.random() * 100,
              y: Math.random() * 100,
              timestamp: Date.now(),
            },
          ]);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setLikes((prev) => prev.filter((l) => Date.now() - l.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showFullscreen) {
      const timer = setTimeout(() => {
        setShowFullscreen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showFullscreen]);

  const sendLike = useCallback(() => {
    if (!room) return;

    try {
      const bytes = new TextEncoder().encode(JSON.stringify({ type: "like" }));
      room.localParticipant.publishData(bytes, {
        reliable: false,
        topic: "like",
      });

      setLikes((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          timestamp: Date.now(),
        },
      ]);

      // Hiển thị icon toàn màn hình
      setShowFullscreen(true);
    } catch (e) {
      console.error("Failed to send like:", e);
    }
  }, [room]);

  return (
    <>
      {/* Nút like (cũng sẽ nằm trong cụm reaction wrapper) */}
      <button
        onClick={sendLike}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200"
        title="Thả like"
      >
        <ThumbsUp className="h-5 w-5 fill-current" />
      </button>

      {/* Icon toàn màn hình rực rỡ */}
      {showFullscreen && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="like-fullscreen-animation">
            <ThumbsUp className="h-64 w-64 fill-current text-sky-500" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-20">
        {likes.map((like) => (
          <div
            key={like.id}
            className="absolute"
            style={{
              left: `${like.x}%`,
              top: `${like.y}%`,
              animation: "float-up 3s ease-out forwards",
            }}
          >
            <ThumbsUp className="h-8 w-8 fill-current text-sky-500 drop-shadow-lg" />
          </div>
        ))}
      </div>

      <style jsx>{`
        .like-fullscreen-animation {
          animation: like-burst 1.5s ease-out forwards;
        }
        @keyframes like-burst {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
            filter: drop-shadow(0 0 0 rgba(14, 165, 233, 0));
          }
          20% {
            opacity: 1;
            transform: scale(1.2) rotate(5deg);
            filter: drop-shadow(0 0 40px rgba(14, 165, 233, 0.8))
              drop-shadow(0 0 80px rgba(14, 165, 233, 0.6))
              drop-shadow(0 0 120px rgba(14, 165, 233, 0.4));
          }
          40% {
            transform: scale(1) rotate(-2deg);
            filter: drop-shadow(0 0 60px rgba(14, 165, 233, 0.9))
              drop-shadow(0 0 120px rgba(14, 165, 233, 0.7))
              drop-shadow(0 0 180px rgba(14, 165, 233, 0.5));
          }
          60% {
            transform: scale(1.1) rotate(1deg);
            filter: drop-shadow(0 0 50px rgba(14, 165, 233, 0.8))
              drop-shadow(0 0 100px rgba(14, 165, 233, 0.6))
              drop-shadow(0 0 150px rgba(14, 165, 233, 0.4));
          }
          100% {
            opacity: 0;
            transform: scale(1.3) rotate(0deg);
            filter: drop-shadow(0 0 100px rgba(14, 165, 233, 0.3))
              drop-shadow(0 0 200px rgba(14, 165, 233, 0.2));
          }
        }
      `}</style>
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
  const [showChatMobile, setShowChatMobile] = useState(false);

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
          throw new Error(
            `${res.status} ${res.statusText}: ${txt || "no body"}`
          );
        }
        return (await res.json()) as JoinResp;
      };

      try {
        let lastErr: any = null;
        for (const delay of [0, 600, 1500]) {
          if (delay) await new Promise((r) => setTimeout(r, delay));
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
      <div className="min-h-[60vh] bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-4 flex items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-800/50 dark:bg-zinc-900">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  Không thể vào phòng
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {err}
                </p>
                <button
                  onClick={() => fetchToken()}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-600"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thử lại</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] bg-zinc-50 pt-16 md:pt-20 dark:bg-zinc-900">
        <div className="grid place-items-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20">
              <Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
    <div className="fixed inset-0 z-10 bg-black overflow-hidden">
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        video={isHost}
        audio={isHost}
        connectOptions={{ autoSubscribe: true }}
        className="relative h-full"
        onDisconnected={() => toast.info("Bạn đã rời phòng")}
      >
        <RoomAudioRenderer />

        {/* Wrapper toàn bộ nội dung live */}
        <div className="absolute inset-0 pt-14">
          <div className="relative h-full w-full overflow-hidden">
            {/* Video + overlay */}
            <LeaveRoomButton />
            <HostTile hostIdentity={hostIdentity} />
            {isHost && <HostControls />}
            {(user?.role === "teacher" || user?.role === "admin") && (
              <ParticipantsList roomName={room} />
            )}
            {/* Cụm reaction gọn góc phải dưới - z-index thấp hơn panel */}
            <div className="absolute bottom-20 right-4 z-30 flex flex-col gap-2">
              <HeartReaction />
              <LikeReaction />
            </div>

            {/* Nút mở chat (dùng cho cả mobile + desktop) - ẩn khi panel mở */}
            {!showChatMobile && (
              <button
                type="button"
                onClick={() => setShowChatMobile(true)}
                className="
      fixed bottom-5 right-4 z-40
      inline-flex h-11 w-11 items-center justify-center
      rounded-full bg-sky-600
      text-sm font-semibold text-white
      shadow-lg shadow-sky-500/40 ring-2 ring-sky-300/80
      backdrop-blur-md
      hover:bg-sky-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0
      transition-all

      md:h-auto md:w-auto md:px-5 md:py-1.5 md:gap-2 md:text-base
    "
                aria-label="Chat phòng học"
              >
                <MessageSquare className="h-5 w-5" />
                {/* ẩn text trên mobile, hiện từ md trở lên */}
                <span className="hidden md:inline">Chat phòng học</span>
              </button>
            )}

            {/* Chat overlay cho mọi kích thước (Zoom-style) - z-index cao hơn */}
            {showChatMobile && (
              <div
                className="absolute inset-0 z-50 flex justify-end"
                onClick={(e) => {
                  // Đóng panel khi click ra ngoài (không phải panel)
                  if (e.target === e.currentTarget) {
                    setShowChatMobile(false);
                  }
                }}
              >
                <ChatPanel
                  me={{
                    id: data.identity,
                    name: data.displayName || "Guest",
                    role: data.role || "student",
                  }}
                  roomName={room}
                  isHost={isHost}
                  hostIdentity={hostIdentity}
                  variant="overlay"
                  onCloseOverlay={() => setShowChatMobile(false)}
                  className="w-full md:w-[380px] h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] md:mt-4 md:mr-4 md:rounded-2xl md:overflow-hidden md:shadow-2xl md:border md:border-zinc-800/60"
                />
              </div>
            )}
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
}

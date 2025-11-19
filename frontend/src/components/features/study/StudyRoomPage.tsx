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
      className="absolute top-4 left-4 z-40 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      aria-label="Rời phòng"
    >
      <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
      <span>Rời phòng</span>
      <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-500">
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
      <div className="flex h-[calc(100dvh-6rem)] items-center justify-center bg-zinc-900 text-white">
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
  const hasCam = !!camRef;
  const hasMic = !!micRef;

  return (
    <div className="relative w-full min-h-[calc(100dvh-6rem)] overflow-hidden bg-black">
      <div className="relative h-[calc(100dvh-6rem)] w-full">
        {screenRef ? (
          <VideoTrack
            trackRef={screenRef}
            className="h-full w-full [&_video]:object-contain"
          />
        ) : camRef ? (
          <VideoTrack
            trackRef={camRef}
            className="h-full w-full [&_video]:object-contain"
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

      {/* Status indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/80 px-2.5 py-1.5 text-white backdrop-blur-sm">
        <Radio className="h-3.5 w-3.5 animate-pulse text-green-400" />
        <Signal className="h-3.5 w-3.5 text-green-400" />
        <span className="text-xs opacity-80">Đang phát</span>
      </div>

      {/* Host info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-white backdrop-blur-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600">
          <Crown className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-medium">{nameLabel}</span>
        <span className="mx-1 opacity-60">•</span>
        <span className="flex items-center gap-2 text-xs">
          {hasCam ? (
            <Video className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <VideoOff className="h-3.5 w-3.5 text-red-400" />
          )}
          {hasMic ? (
            <Mic className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-red-400" />
          )}
        </span>
      </div>
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
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <TrackToggle
          source={Track.Source.Camera}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors duration-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        />
        <TrackToggle
          source={Track.Source.Microphone}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition-colors duration-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        />
        <button
          onClick={toggleScreenShare}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-200 ${
            isSharing
              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
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

  return (
    <div className="absolute top-4 right-4 z-40">
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

  const sendHeart = useCallback(() => {
    if (!room) return;

    try {
      const bytes = new TextEncoder().encode(
        JSON.stringify({ type: "heart" })
      );
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
    } catch (e) {
      console.error("Failed to send heart:", e);
    }
  }, [room]);

  return (
    <>
      <button
        onClick={sendHeart}
        className="absolute bottom-20 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-colors duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        title="Thả tim"
      >
        <Heart className="h-6 w-6 fill-current" />
      </button>

      <div className="pointer-events-none absolute inset-0 z-30">
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
      `}</style>
    </>
  );
}

function LikeReaction() {
  const room = useRoomContext();
  const [likes, setLikes] = useState<
    Array<{ id: string; x: number; y: number; timestamp: number }>
  >([]);

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

  const sendLike = useCallback(() => {
    if (!room) return;

    try {
      const bytes = new TextEncoder().encode(
        JSON.stringify({ type: "like" })
      );
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
    } catch (e) {
      console.error("Failed to send like:", e);
    }
  }, [room]);

  return (
    <>
      <button
        onClick={sendLike}
        className="absolute bottom-32 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        title="Thả like"
      >
        <ThumbsUp className="h-6 w-6 fill-current" />
      </button>

      <div className="pointer-events-none absolute inset-0 z-30">
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
      <div className="min-h-[60vh] bg-zinc-50 pt-16 md:pt-20 dark:bg-zinc-900">
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
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 pt-16 md:min-h-[calc(100dvh-5rem)] md:pt-20 dark:bg-zinc-900">
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

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_360px]">
          <div className="relative">
            <LeaveRoomButton />
            <HostTile hostIdentity={hostIdentity} />
            {isHost && <HostControls />}
            {(user?.role === "teacher" || user?.role === "admin") && (
              <ParticipantsList roomName={room} />
            )}
            <HeartReaction />
            <LikeReaction />
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
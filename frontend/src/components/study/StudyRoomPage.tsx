/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  DisconnectButton,
  TrackToggle,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Track } from "livekit-client";
import { toast } from "sonner";
import {
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  Radio,
  Signal,
  Crown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useRoomContext } from "@livekit/components-react";
import { useBasePrefix } from "@/hooks/useBasePrefix";

/* ===========================
   Types
=========================== */
type JoinResp = {
  wsUrl: string;
  token: string;
  identity: string;
  displayName: string;
  role: "student" | "teacher" | "admin";
  isHost?: boolean;
  hostIdentity?: string;
};

function LeaveRoomButton() {
  const room = useRoomContext();
  const router = useRouter();
  const basePrefix = useBasePrefix("vi");

  const leave = async () => {
    try {
      // Ngắt kết nối LiveKit nếu đang kết nối
      await room?.disconnect?.();
    } catch {
      // ignore
    } finally {
      // Điều hướng về trang lobby/study
      router.replace(`${basePrefix}/study`);
    }
  };

  // Phím tắt ESC để thoát nhanh
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <button
      onClick={leave}
      className="absolute top-4 left-4 z-50 inline-flex items-center gap-2
                 rounded-xl px-3.5 py-2 text-sm font-semibold
                 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md
                 border border-zinc-200 dark:border-zinc-700
                 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition"
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

/* ===========================
   Small helpers
=========================== */
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

/* ===========================
   Viewer Count badge
=========================== */
function ParticipantCount({ room }: { room: string }) {
  const participants = useParticipants();
  return (
    <div
      className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl
      bg-black/70 backdrop-blur-md text-white shadow-lg border border-white/10"
    >
      <Users className="w-4 h-4 opacity-90" />
      <span className="text-sm font-semibold">
        {formatViewers(participants.length)}
      </span>
      <span className="mx-2 opacity-50">•</span>
      <span className="text-[11px] opacity-80 font-mono">{room}</span>
    </div>
  );
}

/* ===========================
   Host Video Surface
=========================== */
function HostVideo({ hostIdentity }: { hostIdentity: string }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  // Xác định host participant (ưu tiên local nếu trùng identity)
  const hostParticipant = useMemo(() => {
    if (localParticipant?.identity === hostIdentity) return localParticipant;
    return participants.find((p) => p.identity === hostIdentity);
  }, [hostIdentity, localParticipant, participants]);

  // Lấy track refs
  const videoRefs = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const audioRefs = useTracks([Track.Source.Microphone], {
    onlySubscribed: false,
  });

  const videoRef = useMemo(
    () => videoRefs.find((t) => t.participant?.identity === hostIdentity),
    [videoRefs, hostIdentity]
  );
  const audioRef = useMemo(
    () => audioRefs.find((t) => t.participant?.identity === hostIdentity),
    [audioRefs, hostIdentity]
  );

  const videoElRef = useRef<HTMLVideoElement>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);

  // Attach/detach video
  useEffect(() => {
    const el = videoElRef.current;
    const track = videoRef?.publication?.track || null;
    if (!el || !track) return;
    try {
      track.attach(el);
    } catch {}
    return () => {
      try {
        track.detach(el);
      } catch {}
    };
  }, [videoRef]);

  // Attach/detach audio
  useEffect(() => {
    const el = audioElRef.current;
    const track = audioRef?.publication?.track || null;
    if (!el || !track) return;
    try {
      track.attach(el);
    } catch {}
    return () => {
      try {
        track.detach(el);
      } catch {}
    };
  }, [audioRef]);

  if (!hostParticipant) {
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

  const hasVideo = !!videoRef?.publication?.track;
  const nameLabel = hostParticipant.name || hostParticipant.identity || "Host";

  return (
    <div className="relative w-full min-h-[calc(100dvh-6rem)] bg-black overflow-hidden">
      {/* Phát âm thanh host */}
      {audioRef?.publication?.track && (
        <audio
          ref={audioElRef}
          autoPlay
          playsInline
          style={{ display: "none" }}
        />
      )}

      {/* Video host */}
      {hasVideo ? (
        <video
          ref={videoElRef}
          className="w-full h-[calc(100dvh-6rem)] object-contain"
          autoPlay
          playsInline
        />
      ) : (
        <div className="flex items-center justify-center h-[calc(100dvh-6rem)] text-white">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto ring-1 ring-white/10">
              <span className="text-2xl font-bold">{initials(nameLabel)}</span>
            </div>
            <p className="text-sm font-medium">{nameLabel}</p>
            <p className="text-xs text-zinc-400 flex items-center gap-1 justify-center">
              <VideoOff className="w-4 h-4" /> Camera chưa bật
            </p>
          </div>
        </div>
      )}

      {/* Overlay: tên host + trạng thái */}
      <div
        className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl
        bg-black/70 backdrop-blur-md text-white shadow-lg border border-white/10"
      >
        <Crown className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium">{nameLabel}</span>
        <span className="mx-1.5 opacity-50">•</span>
        <span className="text-xs flex items-center gap-1 opacity-90">
          {hasVideo ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <VideoOff className="w-3.5 h-3.5" />
          )}
          {audioRef?.publication?.track ? (
            <Mic className="w-3.5 h-3.5" />
          ) : (
            <MicOff className="w-3.5 h-3.5" />
          )}
        </span>
      </div>

      {/* Góc phải: trạng thái kết nối (mang tính hình tượng) */}
      <div
        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl
        bg-black/60 text-white border border-white/10"
      >
        <Radio className="w-4 h-4 opacity-90" />
        <Signal className="w-4 h-4 opacity-90" />
      </div>
    </div>
  );
}

/* ===========================
   Host Controls (no render-props)
   — dùng className thay vì children function để tránh lỗi ReactNode
=========================== */
function HostControls({ isHost }: { isHost: boolean }) {
  if (!isHost) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-2xl
        bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700
        px-3 py-2 shadow-2xl"
      >
        <TrackToggle
          source={Track.Source.Camera}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl
            bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        />
        <TrackToggle
          source={Track.Source.Microphone}
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl
            bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        />
        <DisconnectButton
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl
            bg-rose-600 hover:bg-rose-500 text-white transition"
        />
      </div>
    </div>
  );
}

/* ===========================
   Page
=========================== */
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
      try {
        setLoading(true);
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
        const json: JoinResp = await res.json();
        setData(json);
        setErr(null);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        const msg = e?.message || "Không thể lấy token tham gia phòng.";
        setErr(msg);
        toast.error("Kết nối thất bại", { description: msg });
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

  // Hotkeys cho host (M: mic, V: cam) — LiveKit components tự bind theo DOM button;
  // ở đây chỉ gợi ý: UI không bắt buộc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "m" || k === "v") {
        // để LiveKit handle qua button click (nếu cần có thể querySelector và click)
        // document.querySelector('[data-lk-source="microphone"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!room) return null;

  // Error UI
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
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white
              bg-zinc-900 hover:bg-zinc-800 transition"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Loading UI
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
    <div
      className="pt-16 md:pt-20 min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]
      bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900"
    >
      <LiveKitRoom
        serverUrl={data.wsUrl}
        token={data.token}
        connect
        // chỉ host bật upstream (video/audio)
        video={isHost}
        audio={isHost}
        className="relative h-full"
        onDisconnected={() => toast.message("Bạn đã rời phòng")}
      >
        <LeaveRoomButton />
        <ParticipantCount room={room} />
        <HostVideo hostIdentity={hostIdentity} />
        <HostControls isHost={isHost} />
      </LiveKitRoom>
    </div>
  );
}

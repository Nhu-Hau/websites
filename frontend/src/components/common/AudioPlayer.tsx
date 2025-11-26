"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  /** Số giây bỏ qua ở đầu (mặc định: 2 giây) */
  skipSeconds?: number;
  /** Part number để xử lý logic đặc biệt (ví dụ: part 1 bắt đầu từ 5s48) */
  part?: string | null;
}

// Part 1: bắt đầu từ 5s48 (5.8 giây)
const PART1_START_TIME = 5.8;

/**
 * AudioPlayer component tự động bỏ qua N giây đầu khi phát
 * Part 1: bắt đầu phát từ 5s48, loại bỏ toàn bộ đoạn từ đầu đến 5s47
 */
export function AudioPlayer({
  src,
  className,
  skipSeconds = 2,
  part,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasSetInitialTimeRef = useRef(false);
  const lastSrcRef = useRef<string>("");

  // Kiểm tra xem có phải part 1 không
  const isPart1 = part?.includes("1") || part === "1";
  
  // Thời gian bắt đầu thực tế: Part 1 = 5.8s, các part khác = skipSeconds
  const effectiveStartTime = isPart1 ? PART1_START_TIME : skipSeconds;

  // Hàm đảm bảo thời gian không nhỏ hơn startTime
  const ensureMinTime = useCallback((audio: HTMLAudioElement) => {
    if (audio.currentTime < effectiveStartTime) {
      audio.currentTime = effectiveStartTime;
    }
  }, [effectiveStartTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset khi src thay đổi
    if (lastSrcRef.current !== src) {
      hasSetInitialTimeRef.current = false;
      lastSrcRef.current = src;
    }

    const handlePlay = () => {
      ensureMinTime(audio);
    };

    const handleSeeking = () => {
      ensureMinTime(audio);
    };

    const handleSeeked = () => {
      ensureMinTime(audio);
    };

    const handleTimeUpdate = () => {
      // Chỉ check nếu đang phát và thời gian < startTime
      if (!audio.paused && audio.currentTime < effectiveStartTime) {
        audio.currentTime = effectiveStartTime;
      }
    };

    const handleLoadedMetadata = () => {
      if (!hasSetInitialTimeRef.current && audio.duration) {
        audio.currentTime = effectiveStartTime;
        hasSetInitialTimeRef.current = true;
      }
    };

    const handleCanPlay = () => {
      if (!hasSetInitialTimeRef.current) {
        audio.currentTime = effectiveStartTime;
        hasSetInitialTimeRef.current = true;
      }
    };

    // iPhone fix: load lại audio khi có lỗi
    const handleError = () => {
      if (audio.error) {
        console.warn("[AudioPlayer] Error, reloading:", audio.error.message);
        hasSetInitialTimeRef.current = false;
        audio.load();
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("seeking", handleSeeking);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("seeking", handleSeeking);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [src, effectiveStartTime, ensureMinTime]);

  return (
    <audio
      ref={audioRef}
      controls
      src={src}
      preload="metadata"
      playsInline
      className={cn("h-9 w-full rounded-lg", className)}
    />
  );
}

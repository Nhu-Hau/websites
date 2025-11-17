"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  /** Số giây bỏ qua ở đầu (mặc định: 2 giây) */
  skipSeconds?: number;
}

/**
 * AudioPlayer component tự động bỏ qua N giây đầu khi phát
 */
export function AudioPlayer({ src, className, skipSeconds = 2 }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasSetInitialTimeRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Hàm helper để set thời gian đến skipSeconds
    const setToSkipTime = () => {
      if (audio.currentTime < skipSeconds) {
        audio.currentTime = skipSeconds;
      }
    };

    // Xử lý khi bắt đầu phát - nhảy đến skipSeconds nếu đang ở trước đó
    const handlePlay = () => {
      setToSkipTime();
    };

    // Xử lý khi seek - ngăn seek về trước skipSeconds
    const handleSeeking = () => {
      if (audio.currentTime < skipSeconds) {
        audio.currentTime = skipSeconds;
      }
    };

    // Xử lý khi seeked - đảm bảo không ở trước skipSeconds
    const handleSeeked = () => {
      setToSkipTime();
    };

    // Xử lý khi loadedmetadata - set initial time về skipSeconds (chỉ một lần)
    const handleLoadedMetadata = () => {
      if (!hasSetInitialTimeRef.current && audio.duration) {
        audio.currentTime = skipSeconds;
        hasSetInitialTimeRef.current = true;
      }
    };

    // Xử lý khi canplaythrough - đảm bảo time được set đúng
    const handleCanPlayThrough = () => {
      if (audio.paused && audio.currentTime < skipSeconds) {
        audio.currentTime = skipSeconds;
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("seeking", handleSeeking);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("seeking", handleSeeking);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    };
  }, [skipSeconds, src]);

  // Reset flag khi src thay đổi
  useEffect(() => {
    hasSetInitialTimeRef.current = false;
  }, [src]);

  return <audio ref={audioRef} controls src={src} className={cn("h-9 w-full rounded-lg", className)} />;
}


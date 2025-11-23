"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  /** Số giây bỏ qua ở đầu (mặc định: 2 giây) */
  skipSeconds?: number;
  /** Part number để xử lý logic đặc biệt (ví dụ: part 1 cần cắt đoạn 3.14-4.3s) */
  part?: string | null;
}

/**
 * AudioPlayer component tự động bỏ qua N giây đầu khi phát
 */
export function AudioPlayer({
  src,
  className,
  skipSeconds = 2,
  part,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasSetInitialTimeRef = useRef(false);

  // Kiểm tra xem có phải part 1 không
  const isPart1 = part?.includes("1") || part === "1";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Hàm helper để set thời gian đến skipSeconds
    const setToSkipTime = () => {
      if (audio.currentTime < skipSeconds) {
        audio.currentTime = skipSeconds;
      }
    };

    // Hàm helper để bỏ qua đoạn 3.14-4.3s cho part 1
    const skipPart1Cut = () => {
      if (isPart1 && audio.currentTime >= 3.14 && audio.currentTime < 4.3) {
        audio.currentTime = 4.3;
      }
    };

    // Xử lý khi bắt đầu phát - nhảy đến skipSeconds nếu đang ở trước đó
    const handlePlay = () => {
      setToSkipTime();
      skipPart1Cut();
    };

    // Xử lý khi seek - ngăn seek về trước skipSeconds và vào đoạn cần cắt
    const handleSeeking = () => {
      if (audio.currentTime < skipSeconds) {
        audio.currentTime = skipSeconds;
      }
      skipPart1Cut();
    };

    // Xử lý khi seeked - đảm bảo không ở trước skipSeconds và không ở trong đoạn cần cắt
    const handleSeeked = () => {
      setToSkipTime();
      skipPart1Cut();
    };

    // Xử lý khi timeupdate - tự động bỏ qua đoạn 3.14-4.3s cho part 1
    const handleTimeUpdate = () => {
      skipPart1Cut();
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
      skipPart1Cut();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("seeking", handleSeeking);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("seeking", handleSeeking);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    };
  }, [skipSeconds, src, isPart1]);

  // Reset flag khi src thay đổi
  useEffect(() => {
    hasSetInitialTimeRef.current = false;
  }, [src]);

  return (
    <audio
      ref={audioRef}
      controls
      src={src}
      className={cn("h-9 w-full rounded-lg", className)}
    />
  );
}

"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { Attachment } from "@/types/community.types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const MEDIA_SIZES = "(max-width: 768px) 100vw, 480px";

type MediaGalleryProps = {
  attachments: Attachment[];
  className?: string;
};

function getFullUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function VideoPlayer({ attachment }: { attachment: Attachment }) {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  const handlePause = () => {
    setPlaying(false);
    videoRef.current?.pause();
  };

  const url = getFullUrl(attachment.url);
  const thumbnail = attachment.thumbnail
    ? getFullUrl(attachment.thumbnail)
    : null;

  return (
    <div className="relative w-full h-full group">
      {!playing && (
        <button
          type="button"
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          onClick={handlePlay}
          aria-label="Phát video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white">
            <Play className="ml-1 h-8 w-8 text-zinc-900" fill="currentColor" />
          </div>
        </button>
      )}
      {thumbnail && !playing && (
        <div className="absolute inset-0">
          <Image
            src={thumbnail}
            alt="Video thumbnail"
            fill
            className="object-cover"
            sizes={MEDIA_SIZES}
            unoptimized
            priority={false}
          />
        </div>
      )}
      <video
        ref={videoRef}
        src={url}
        controls={playing}
        className="w-full h-full object-contain"
        onPlay={handlePlay}
        onPause={handlePause}
        playsInline
      />
    </div>
  );
}

function ImageItem({
  attachment,
  className = "",
}: {
  attachment: Attachment;
  className?: string;
}) {
  const url = getFullUrl(attachment.url);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div
        className={`bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ${className}`}
      >
        <span className="text-xs text-zinc-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      )}
      <Image
        src={url}
        alt={attachment.name || "Hình ảnh đính kèm"}
        fill
        className="object-contain"
        sizes={MEDIA_SIZES}
        onLoadingComplete={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        unoptimized
        priority={false}
      />
    </div>
  );
}

function CarouselGallery({ attachments }: { attachments: Attachment[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const validAttachments = attachments.filter(
    (a) => a && a.url && (a.type === "image" || a.type === "video")
  );
  const images = validAttachments.filter((a) => a.type === "image");
  const videos = validAttachments.filter((a) => a.type === "video");
  const allMedia = [...images, ...videos];

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  if (allMedia.length === 0) return null;

  return (
    <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden">
      {allMedia.map((media, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-300 ${
            idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {media.type === "video" ? (
            <VideoPlayer attachment={media} />
          ) : (
            <ImageItem attachment={media} className="w-full h-full" />
          )}
        </div>
      ))}

      {allMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
            {allMedia.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GridGallery({ attachments }: { attachments: Attachment[] }) {
  const validAttachments = attachments.filter(
    (a) => a && a.url && (a.type === "image" || a.type === "video")
  );
  const images = validAttachments.filter((a) => a.type === "image");
  const videos = validAttachments.filter((a) => a.type === "video");
  const allMedia = [...images, ...videos].slice(0, 4);

  if (allMedia.length === 0) return null;

  // Grid 2x2
  if (allMedia.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        {allMedia.map((media, idx) => (
          <div
            key={idx}
            className="relative aspect-square bg-zinc-100 dark:bg-zinc-900"
          >
            {media.type === "video" ? (
              <VideoPlayer attachment={media} />
            ) : (
              <ImageItem attachment={media} className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Less than 4 items - still use grid but adjust
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
      {allMedia.map((media, idx) => (
        <div
          key={idx}
          className={`relative bg-zinc-100 dark:bg-zinc-900 ${
            allMedia.length === 1 ? "col-span-2 aspect-square" : "aspect-square"
          }`}
        >
          {media.type === "video" ? (
            <VideoPlayer attachment={media} />
          ) : (
            <ImageItem attachment={media} className="w-full h-full" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MediaGallery({
  attachments,
  className = "",
}: MediaGalleryProps) {
  // Filter and validate attachments
  const validAttachments = attachments.filter(
    (a) => a && a.url && (a.type === "image" || a.type === "video")
  );
  const images = validAttachments.filter((a) => a.type === "image");
  const videos = validAttachments.filter((a) => a.type === "video");
  const allMedia = [...images, ...videos];

  if (allMedia.length === 0) return null;

  // Single image/video: full display
  if (allMedia.length === 1) {
    const media = allMedia[0];
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {media.type === "video" ? (
            <div className="aspect-video">
              <VideoPlayer attachment={media} />
            </div>
          ) : (
            <div className="relative w-full">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={getFullUrl(media.url)}
                  alt={media.name || "Hình ảnh đính kèm"}
                  fill
                  className="object-contain"
                  sizes={MEDIA_SIZES}
                  unoptimized
                  priority={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2-3 items: carousel
  if (allMedia.length <= 3) {
    return <CarouselGallery attachments={attachments} />;
  }

  // 4+ items: grid 2x2
  return <GridGallery attachments={attachments} />;
}

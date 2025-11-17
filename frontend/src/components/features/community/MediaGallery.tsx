"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { Attachment } from "@/types/community.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
  const thumbnail = attachment.thumbnail ? getFullUrl(attachment.thumbnail) : null;

  return (
    <div className="relative w-full h-full group">
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 cursor-pointer z-10"
          onClick={handlePlay}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
            <Play className="w-8 h-8 text-zinc-900 ml-1" fill="currentColor" />
          </div>
        </div>
      )}
      {thumbnail && !playing && (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover"
        />
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

function ImageItem({ attachment, className = "" }: { attachment: Attachment; className?: string }) {
  const url = getFullUrl(attachment.url);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div className={`bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ${className}`}>
        <span className="text-xs text-zinc-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      )}
      <img
        src={url}
        alt={attachment.name || "Image"}
        className="w-full h-full object-cover"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        loading="lazy"
      />
    </div>
  );
}

function CarouselGallery({ attachments }: { attachments: Attachment[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
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
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
            {allMedia.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GridGallery({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
  const allMedia = [...images, ...videos].slice(0, 4);

  if (allMedia.length === 0) return null;

  // Grid 2x2
  if (allMedia.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        {allMedia.map((media, idx) => (
          <div key={idx} className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
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

export default function MediaGallery({ attachments, className = "" }: MediaGalleryProps) {
  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
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
            <img
              src={getFullUrl(media.url)}
              alt={media.name || "Image"}
              className="w-full h-auto max-h-[600px] object-contain"
              loading="lazy"
            />
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


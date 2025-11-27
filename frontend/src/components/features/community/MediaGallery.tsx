"use client";

import React from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  Download,
} from "lucide-react";
import type { Attachment } from "@/types/community.types";
import { useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// Blur placeholder for images
const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAGgwJ/lzvYswAAAABJRU5ErkJggg==";

type MediaGalleryProps = {
  attachments: Attachment[];
  className?: string;
  priorityFirstImage?: boolean; // For post author's first image
};

function getFullUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function VideoPlayer({ attachment }: { attachment: Attachment }) {
  const t = useTranslations("community.media");
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

  const showThumbnail = !!thumbnail && !playing;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 group">
      {showThumbnail && (
        <Image
          src={thumbnail}
          alt={t("videoThumbnailAlt")}
          width={800}
          height={450}
          sizes="(max-width: 768px) 100vw, 800px"
          className="w-full h-auto object-contain"
          loading="lazy"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      )}
      <video
        ref={videoRef}
        src={url}
        controls={playing}
        className={`w-full h-auto ${showThumbnail ? "hidden" : "block"}`}
        onPlay={handlePlay}
        onPause={handlePause}
        playsInline
      />
      {!playing && (
        <button
          type="button"
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          onClick={handlePlay}
          aria-label={t("playVideo")}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white">
            <Play className="ml-1 h-8 w-8 text-zinc-900" fill="currentColor" />
          </div>
        </button>
      )}
    </div>
  );
}

function FileItem({ attachment }: { attachment: Attachment }) {
  const url = getFullUrl(attachment.url);
  const fileName = attachment.name || "Document";
  const ext = fileName.toLowerCase().split(".").pop() || "";
  const isPdf = ext === "pdf";
  const isWord = ext === "doc" || ext === "docx";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="
    flex items-center gap-2.5
    rounded-xl border border-zinc-200 dark:border-zinc-700
    bg-zinc-50 dark:bg-zinc-800
    p-2.5 sm:p-3
    hover:bg-zinc-100 dark:hover:bg-zinc-700
    transition-colors w-fit
  "
    >
      <div
        className={`
      flex h-9 w-9 sm:h-10 sm:w-10
      items-center justify-center
      rounded-lg flex-shrink-0
      ${
        isPdf
          ? "bg-red-100 dark:bg-red-900/30"
          : isWord
          ? "bg-blue-100 dark:bg-blue-900/30"
          : "bg-zinc-200 dark:bg-zinc-700"
      }
    `}
      >
        <FileText
          className={`
        h-4 w-4 sm:h-5 sm:w-5
        ${
          isPdf
            ? "text-red-600 dark:text-red-400"
            : isWord
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-600 dark:text-zinc-400"
        }
      `}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {fileName}
        </p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
          {ext}
        </p>
      </div>

      <Download className="h-4 w-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
    </a>
  );
}

function ImageItem({
  attachment,
  className = "",
  priority = false,
}: {
  attachment: Attachment;
  className?: string;
  priority?: boolean;
}) {
  const t = useTranslations("community.media");
  const url = getFullUrl(attachment.url);
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div
        className={`bg-zinc-100 dark:bg-zinc-800 flex w-full items-center justify-center rounded-xl min-h-[200px] ${className}`}
      >
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("loadError")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
      <Image
        src={url}
        alt={attachment.name || t("imageAlt")}
        width={800}
        height={600}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
        className="w-full h-auto rounded-xl object-contain"
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        onError={() => setError(true)}
      />
    </div>
  );
}

function CarouselGallery({ attachments, priorityFirst = false }: { attachments: Attachment[]; priorityFirst?: boolean }) {
  const t = useTranslations("community.media");
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

  const activeMedia = allMedia[currentIndex];
  const renderMedia = (media: Attachment, isFirst = false) =>
    media.type === "video" ? (
      <VideoPlayer attachment={media} />
    ) : (
      <ImageItem attachment={media} priority={isFirst && priorityFirst} />
    );

  return (
    <div className="relative w-full rounded-lg bg-zinc-100 dark:bg-zinc-900">
      <div className="w-full">{renderMedia(activeMedia, currentIndex === 0)}</div>

      {allMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label={t("prevImage")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label={t("nextImage")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">
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
                aria-label={t("goToSlide", { index: idx + 1 })}
                aria-current={idx === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GridGallery({ attachments, priorityFirst = false }: { attachments: Attachment[]; priorityFirst?: boolean }) {
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
      <div className="grid grid-cols-2 gap-1 rounded-lg">
        {allMedia.map((media, idx) => (
          <div
            key={idx}
            className="rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
          >
            {media.type === "video" ? (
              <VideoPlayer attachment={media} />
            ) : (
              <ImageItem attachment={media} priority={idx === 0 && priorityFirst} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Less than 4 items - still use grid but adjust
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg">
      {allMedia.map((media, idx) => (
        <div
          key={idx}
          className={`rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900 ${
            allMedia.length === 1 ? "col-span-2" : ""
          }`}
        >
          {media.type === "video" ? (
            <VideoPlayer attachment={media} />
          ) : (
            <ImageItem attachment={media} priority={idx === 0 && priorityFirst} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MediaGallery({
  attachments,
  className = "",
  priorityFirstImage = false,
}: MediaGalleryProps) {
  const t = useTranslations("community.media");
  // Filter and validate attachments
  const validAttachments = attachments.filter(
    (a) =>
      a &&
      a.url &&
      (a.type === "image" || a.type === "video" || a.type === "file")
  );
  const images = validAttachments.filter((a) => a.type === "image");
  const videos = validAttachments.filter((a) => a.type === "video");
  const files = validAttachments.filter((a) => a.type === "file");
  const allMedia = [...images, ...videos];

  if (allMedia.length === 0 && files.length === 0) return null;

  // Render file attachments
  if (files.length > 0 && allMedia.length === 0) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {files.map((file, idx) => (
          <FileItem key={idx} attachment={file} />
        ))}
      </div>
    );
  }

  // Helper to render files section
  const filesSection =
    files.length > 0 ? (
      <div className="mt-3 flex flex-col gap-2">
        {files.map((file, idx) => (
          <FileItem key={idx} attachment={file} />
        ))}
      </div>
    ) : null;

  // Single image/video: full display
  if (allMedia.length === 1) {
    const media = allMedia[0];
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
          {media.type === "video" ? (
            <div className="aspect-video">
              <VideoPlayer attachment={media} />
            </div>
          ) : (
            <div className="w-full max-w-sm mx-auto">
              <Image
                src={getFullUrl(media.url)}
                alt={media.name || t("imageAlt")}
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                className="w-full h-auto rounded-lg object-contain"
                priority={priorityFirstImage}
                loading={priorityFirstImage ? undefined : "lazy"}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex flex-col items-center justify-center min-h-[200px] bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <svg class="h-8 w-8 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-xs text-zinc-500 dark:text-zinc-400 mt-2">${t("loadError")}</span>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          )}
        </div>
        {filesSection}
      </div>
    );
  }

  // 2-3 items: carousel
  if (allMedia.length <= 3) {
    return (
      <div className={className}>
        <CarouselGallery attachments={attachments} priorityFirst={priorityFirstImage} />
        {filesSection}
      </div>
    );
  }

  // 4+ items: grid 2x2
  return (
    <div className={className}>
      <GridGallery attachments={attachments} priorityFirst={priorityFirstImage} />
      {filesSection}
    </div>
  );
}

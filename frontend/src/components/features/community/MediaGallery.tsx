"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, FileText, Download } from "lucide-react";
import type { Attachment } from "@/types/community.types";
import { useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
type MediaGalleryProps = {
  attachments: Attachment[];
  className?: string;
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
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto object-contain"
          priority={false}
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
      className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isPdf ? "bg-red-100 dark:bg-red-900/30" : isWord ? "bg-blue-100 dark:bg-blue-900/30" : "bg-zinc-200 dark:bg-zinc-700"}`}>
        <FileText className={`h-6 w-6 ${isPdf ? "text-red-600 dark:text-red-400" : isWord ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{fileName}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">{ext}</p>
      </div>
      <Download className="h-5 w-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
    </a>
  );
}

function ImageItem({
  attachment,
  className = "",
}: {
  attachment: Attachment;
  className?: string;
}) {
  const t = useTranslations("community.media");
  const url = getFullUrl(attachment.url);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div
        className={`bg-zinc-100 dark:bg-zinc-800 flex w-full items-center justify-center rounded-xl ${className}`}
      >
        <span className="text-xs text-zinc-500">{t("loadError")}</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
      {loading && (
        <div className="absolute inset-0 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      )}
      <Image
        src={url}
        alt={attachment.name || t("imageAlt")}
        width={0}
        height={0}
        className="w-full h-auto rounded-xl object-contain"
        sizes="100vw"
        onLoadingComplete={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        priority={false}
      />
    </div>
  );
}

function CarouselGallery({ attachments }: { attachments: Attachment[] }) {
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
  const renderMedia = (media: Attachment) =>
    media.type === "video" ? (
      <VideoPlayer attachment={media} />
    ) : (
      <ImageItem attachment={media} />
    );

  return (
    <div className="relative w-full rounded-lg bg-zinc-100 dark:bg-zinc-900">
      <div className="w-full">{renderMedia(activeMedia)}</div>

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
      <div className="grid grid-cols-2 gap-1 rounded-lg">
        {allMedia.map((media, idx) => (
          <div
            key={idx}
            className="rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
          >
            {media.type === "video" ? (
              <VideoPlayer attachment={media} />
            ) : (
              <ImageItem attachment={media} />
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
            <ImageItem attachment={media} />
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
  const t = useTranslations("community.media");
  // Filter and validate attachments
  const validAttachments = attachments.filter(
    (a) => a && a.url && (a.type === "image" || a.type === "video" || a.type === "file")
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
  const filesSection = files.length > 0 ? (
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
            <div className="w-full">
              <Image
                src={getFullUrl(media.url)}
                alt={media.name || t("imageAlt")}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto rounded-lg object-contain"
                priority={false}
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
        <CarouselGallery attachments={attachments} />
        {filesSection}
      </div>
    );
  }

  // 4+ items: grid 2x2
  return (
    <div className={className}>
      <GridGallery attachments={attachments} />
      {filesSection}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

interface TextWithHighlightsProps {
  text: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
  onMentionClick?: (username: string) => void;
}

export default function TextWithHighlights({
  text,
  className = "",
  onHashtagClick,
  onMentionClick,
}: TextWithHighlightsProps) {
  const basePrefix = useBasePrefix();
  const parts: React.ReactNode[] = [];
  const regex = /(#\w+|@\w+)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add highlighted match
    const isHashtag = match[0].startsWith("#");
    const value = match[0].slice(1);

    if (isHashtag) {
      parts.push(
        <Link
          key={`hashtag-${key++}`}
          href={`${basePrefix}/community/hashtag/${value}`}
          onClick={(e) => {
            e.stopPropagation();
            onHashtagClick?.(value);
          }}
          className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
        >
          {match[0]}
        </Link>
      );
    } else {
      // For mentions, we'll need to resolve username to userId
      // For now, just highlight it
      parts.push(
        <span
          key={`mention-${key++}`}
          className="text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onMentionClick?.(value);
          }}
        >
          {match[0]}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${key++}`}>{text.slice(lastIndex)}</span>
    );
  }

  return (
    <p className={className}>
      {parts.length > 0 ? parts : text}
    </p>
  );
}








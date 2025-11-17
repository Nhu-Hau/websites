"use client"
import React, { useState } from "react";
import Image from "next/image";

export function TestimonialAvatar({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallback =
    "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/default-avatar.png";

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={40}
      height={40}
      sizes="40px"
      className="h-10 w-10 rounded-full object-cover"
      onError={() => setImgSrc(fallback)}
      loading="lazy"
    />
  );
}

















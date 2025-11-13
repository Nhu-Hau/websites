"use client";
import React from "react";

export default function GoogleButton({
  text,
  loading,
  onClick,
  className,
}: {
  text: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!!loading}
      className={[
        "mt-4 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 inline-flex items-center justify-center gap-2",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60",
        "text-zinc-800 dark:text-zinc-100",
        className || "",
      ].join(" ")}
    >
      <GoogleIcon className="h-4 w-4" />
      {loading ? "…" : text}
    </button>
  );
}

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden {...props}>
      <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.2H272.1v95.3h146.8c-6.3 34-25.1 62.7-53.5 82v68h86.2c50.3-46.4 81.9-114.8 81.9-195.1z" />
      <path fill="#34A853" d="M272.1 544.3c72.9 0 134.1-24.1 178.8-65.5l-86.2-68c-24 16.1-54.7 25.7-92.6 25.7-71.2 0-131.6-48-153.2-112.4H28.6v70.6c44.4 88 135.9 149.6 243.5 149.6z" />
      <path fill="#FBBC05" d="M118.9 324.1c-10.7-31.9-10.7-66.3 0-98.2V155.3H28.6c-37.8 75.2-37.8 165.9 0 241.1l90.3-72.3z" />
      <path fill="#EA4335" d="M272.1 107.7c39.7-.6 78.1 14 107.5 41.1l80.2-80.2C407.2 24.6 341.4 0 272.1 0 164.5 0 73 61.6 28.6 149.6l90.3 70.8C140.5 155.7 200.9 107.7 272.1 107.7z" />
    </svg>
  );
}

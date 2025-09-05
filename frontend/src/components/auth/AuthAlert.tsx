"use client";

export default function AuthAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-700
                 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300"
    >
      {message}
    </div>
  );
}

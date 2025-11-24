/**
 * Unified Loading System
 * Consistent loading states across the application
 */

"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2
        className={cn(
          "animate-spin text-blue-600 dark:text-blue-400",
          sizeClasses[size]
        )}
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  show: boolean;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ show, text = "Đang tải...", fullScreen = false }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
        fullScreen ? "fixed" : "absolute"
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {text && (
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoading({ loading, children, className }: ButtonLoadingProps) {
  return (
    <button
      className={cn("relative", className)}
      disabled={loading}
      aria-busy={loading}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
      <span className={cn(loading && "opacity-0")}>{children}</span>
    </button>
  );
}

/**
 * Inline loading text
 */
export function LoadingText({ text = "Đang tải..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}





/**
 * Unified Skeleton UI System
 * Provides consistent skeleton loaders matching actual UI layouts
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "rectangular" | "text";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 dark:bg-gray-800";
  const animateClasses = animate ? "animate-pulse" : "";
  
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    text: "rounded",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(baseClasses, animateClasses, variantClasses[variant], className)}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
}

/**
 * Card Skeleton - matches card component layout
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6", className)}>
      <Skeleton height={24} width="60%" className="mb-4" />
      <Skeleton height={16} width="100%" className="mb-2" />
      <Skeleton height={16} width="80%" />
    </div>
  );
}

/**
 * Vocabulary Card Skeleton
 */
export function VocabularyCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton height={28} width="70%" className="mb-3" />
          <Skeleton height={20} width="50%" />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton height={16} width="100%" className="mb-2" />
      <Skeleton height={16} width="90%" />
    </div>
  );
}

/**
 * News Card Skeleton
 */
export function NewsCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
      <Skeleton height={200} width="100%" variant="rectangular" />
      <div className="p-4 sm:p-6">
        <Skeleton height={24} width="80%" className="mb-3" />
        <Skeleton height={16} width="100%" className="mb-2" />
        <Skeleton height={16} width="90%" className="mb-4" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton height={16} width="120px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * List Item Skeleton
 */
export function ListItemSkeleton({ showAvatar = false }: { showAvatar?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
      {showAvatar && <Skeleton variant="circular" width={48} height={48} />}
      <div className="flex-1">
        <Skeleton height={20} width="60%" className="mb-2" />
        <Skeleton height={16} width="40%" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={20} width="100%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} height={16} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-white dark:bg-gray-800">
      <Skeleton height={24} width="40%" className="mb-4" />
      <Skeleton height={height} width="100%" />
    </div>
  );
}

/**
 * Page Skeleton - full page loading state
 */
export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return <div className="animate-pulse">{children}</div>;
}






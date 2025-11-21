import { BookOpenCheck } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 py-12 text-center shadow-sm sm:px-6 sm:py-16 dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {/* Icon */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2E5EB8]/15 text-[#2E5EB8] dark:bg-[#2E5EB8]/25 dark:text-[#86A7F5]">
        <BookOpenCheck className="h-7 w-7 sm:h-8 sm:w-8" />
      </div>

      {/* Title */}
      <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      {/* Action (optional button/link) */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

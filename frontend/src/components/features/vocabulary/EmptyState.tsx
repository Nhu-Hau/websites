import { BookOpenCheck } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/60 bg-white/90 px-4 py-12 text-center shadow-sm backdrop-blur-xl sm:px-6 sm:py-16 dark:border-zinc-800/60 dark:bg-zinc-900/90">
      {/* Icon */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#4063bb]/15 text-[#4063bb] dark:bg-[#4063bb]/25 dark:text-sky-200">
        <BookOpenCheck className="h-7 w-7 sm:h-8 sm:w-8" />
      </div>

      {/* Title */}
      <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-zinc-50">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-1 max-w-sm text-sm text-slate-600 dark:text-zinc-400">
        {description}
      </p>

      {/* Action (optional button/link) */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

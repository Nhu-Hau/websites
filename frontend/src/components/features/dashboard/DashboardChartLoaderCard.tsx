import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardChartLoaderCardProps {
  title: string;
  subtitle?: string;
  accentClass?: string;
  icon?: React.ReactNode;
  badgeLabel?: string;
  heightClass?: string;
  descriptionSlot?: React.ReactNode;
}

export default function DashboardChartLoaderCard({
  title,
  subtitle,
  accentClass,
  icon,
  badgeLabel,
  heightClass = "h-52 sm:h-60 md:h-64",
  descriptionSlot,
}: DashboardChartLoaderCardProps) {
  const t = useTranslations("dashboard");
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {accentClass && (
        <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50 xs:text-xl">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-[13px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {badgeLabel && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/80">
            {badgeLabel}
          </div>
        )}
      </div>

      {descriptionSlot}

      <div className={`relative ${heightClass}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("loading")}
          </p>
        </div>
      </div>
    </div>
  );
}

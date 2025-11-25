"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function TestLoadingState({ message }: { message?: string } = {}) {
  const t = useTranslations("practice");
  const displayMessage = message || t("loading");

  return (
    <div className="flex flex-col items-center justify-center py-14">
      <div className="inline-block h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
      <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {displayMessage}
      </p>
    </div>
  );
}

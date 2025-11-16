"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import type { Item, ChoiceId } from "@/types/tests.types";

export type ResultLayoutProps = {
  children: React.ReactNode;
  // Sidebar props
  items: Item[];
  answers: Record<string, ChoiceId>;
  resp: any;
  total: number;
  answered: number;
  timeLabel: string;
  onJump: (i: number) => void;
  onToggleDetails: () => void;
  showDetails: boolean;
  focusMode: boolean;
  onToggleFocus: () => void;
};

export function ResultLayout({
  children,
  items,
  answers,
  resp,
  total,
  answered,
  timeLabel,
  onJump,
  onToggleDetails,
  showDetails,
  focusMode,
  onToggleFocus,
}: ResultLayoutProps) {
  return (
    <div className="mt-16 min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-24 dark:bg-zinc-950/80">
      <div className="w-full">
        {/* Sidebar */}
        <Sidebar
          items={items}
          answers={answers}
          resp={resp || null}
          total={total}
          answered={answered}
          timeLabel={timeLabel}
          onSubmit={() => {}}
          onJump={onJump}
          onToggleDetails={onToggleDetails}
          showDetails={showDetails}
          countdownSec={35 * 60}
          started
          onStart={() => {}}
          isAuthed
          onLoginRequest={() => {}}
          focusMode={focusMode}
          onToggleFocus={onToggleFocus}
        />

        {/* Main content */}
        <main
          className={`flex-1 pb-28 lg:pb-12 pt-6 sm:pt-8 px-5 lg:pl-6 transition-all duration-300 ${
            focusMode ? "lg:ml-[72px]" : "lg:ml-[260px]"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import FocusHUD from "./FocusHUD";
import type { Item, ChoiceId } from "@/types/tests.types";

export type TestLayoutProps = {
  children: React.ReactNode;
  // Sidebar props
  items: Item[];
  answers: Record<string, ChoiceId>;
  resp: any;
  total: number;
  answered: number;
  timeLabel: string;
  onSubmit: () => void;
  onSubmitWithLeftSec?: (left: number) => void;
  onJump: (i: number) => void;
  onToggleDetails: () => void;
  showDetails: boolean;
  countdownSec?: number;
  initialLeftSec?: number;
  started: boolean;
  onStart: () => void;
  isAuthed: boolean;
  onLoginRequest: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  // FocusHUD props
  durationMin: number;
  currentIndex: number;
  leftSec: number;
  progressPercent: number;
  onOpenQuickNav: () => void;
  mobileNavOpen?: boolean; // mobile quick nav sheet đang mở
};

export function TestLayout({
  children,
  items,
  answers,
  resp,
  total,
  answered,
  timeLabel,
  onSubmit,
  onSubmitWithLeftSec,
  onJump,
  onToggleDetails,
  showDetails,
  countdownSec = 35 * 60,
  initialLeftSec,
  started,
  onStart,
  isAuthed,
  onLoginRequest,
  focusMode,
  onToggleFocus,
  durationMin,
  currentIndex,
  leftSec,
  progressPercent,
  onOpenQuickNav,
  mobileNavOpen = false,
}: TestLayoutProps) {
  return (
    <div className="pt-14 min-h-[calc(100vh-5rem)] bg-slate-50/70 pb-24 dark:bg-zinc-950/70">
      <div className="w-full">
        {/* Sidebar */}
        <Sidebar
          items={items}
          answers={answers}
          resp={resp || null}
          total={total}
          answered={answered}
          timeLabel={timeLabel}
          onSubmit={onSubmit}
          onSubmitWithLeftSec={onSubmitWithLeftSec}
          onJump={onJump}
          onToggleDetails={onToggleDetails}
          showDetails={showDetails}
          countdownSec={countdownSec}
          initialLeftSec={initialLeftSec}
          started={started}
          onStart={onStart}
          isAuthed={isAuthed}
          onLoginRequest={onLoginRequest}
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

      {/* HUD focus (floating) */}
      <FocusHUD
        started={started}
        resp={resp}
        focusMode={focusMode}
        mobileNavOpen={mobileNavOpen}
        durationMin={durationMin}
        total={total}
        currentIndex={currentIndex}
        leftSec={leftSec}
        progressPercent={progressPercent}
        onStart={onStart}
        onSubmit={onSubmit}
        onOpenQuickNav={onOpenQuickNav}
        onToggleFocus={onToggleFocus}
      />
    </div>
  );
}


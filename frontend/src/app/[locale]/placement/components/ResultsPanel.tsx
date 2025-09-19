"use client";

import React from "react";
import type { GradeResp } from "@/types/placement";

export function ResultsPanel({ resp, timeLabel, onToggleDetails, showDetails }:{
  resp: GradeResp;
  timeLabel: string;
  onToggleDetails: () => void;
  showDetails: boolean;
}) {
  return (
    <div className="p-6 rounded-2xl border bg-gray-50 text-center">
      <h2 className="text-2xl font-bold mb-4">TỔNG QUAN</h2>
      <p className="text-lg">
        Số câu đúng: <b>{resp.correct}</b> / {resp.total}
      </p>
      <p className="text-lg">
        Chính xác: <b className="text-green-600">{(resp.acc * 100).toFixed(1)}%</b>
      </p>
      <p className="text-lg">
        Listening: <b>{resp.listening.correct}/{resp.listening.total}</b> ({(resp.listening.acc * 100).toFixed(1)}%)
      </p>
      <p className="text-lg">
        Reading: <b>{resp.reading.correct}/{resp.reading.total}</b> ({(resp.reading.acc * 100).toFixed(1)}%)
      </p>
      <p className="text-sm text-gray-500 mt-2">Thời gian làm: {timeLabel}</p>
      <div className="mt-4">
        <button onClick={onToggleDetails} className="px-4 py-2 rounded-xl border">
          {showDetails ? "Ẩn chi tiết đáp án" : "Xem chi tiết đáp án"}
        </button>
      </div>
    </div>
  );
}
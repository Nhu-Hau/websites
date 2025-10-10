"use client";

type TestGradeResp = {
  total: number;
  correct: number;
  acc: number;
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  timeSec: number;
};

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TestResultsPanel({
  resp,
  timeLabel,
  onToggleDetails,
  showDetails,
}: {
  resp: TestGradeResp;
  timeLabel?: string;
  onToggleDetails?: () => void;
  showDetails?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4 space-y-2">
        <div className="font-semibold text-center">TỔNG QUAN</div>
        <div className="text-sm text-center">
          Đúng: <b>{resp.correct}</b> / {resp.total}
        </div>
        <div className="text-sm text-center">
          Chính xác: <b className="text-green-600">{(resp.acc * 100).toFixed(1)}%</b>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Listening: {resp.listening.correct}/{resp.listening.total} ({(resp.listening.acc * 100).toFixed(0)}%)<br />
          Reading: {resp.reading.correct}/{resp.reading.total} ({(resp.reading.acc * 100).toFixed(0)}%)
        </div>
        <div className="text-sm text-center mt-1">
          Thời gian làm: <b>{timeLabel ?? fmtTime(resp.timeSec)}</b>
        </div>

        {!!onToggleDetails && (
          <button onClick={onToggleDetails} className="w-full mt-2 px-3 py-2 rounded-xl border">
            {showDetails ? "Ẩn chi tiết đáp án" : "Xem chi tiết đáp án"}
          </button>
        )}
      </div>
    </div>
  );
}
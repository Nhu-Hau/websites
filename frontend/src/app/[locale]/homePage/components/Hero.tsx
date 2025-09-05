"use client";
import React from "react";
import Link from "next/link";
import { FiShield, FiPlayCircle, FiArrowRight, FiBarChart2, FiClock, FiHeadphones, FiBookOpen, FiCheckCircle } from "react-icons/fi";

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">{number}</div>
      <div className="text-xs text-slate-600 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function PlacementPrompt({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: () => void }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Kiểm tra nhanh – Placement Test</h2>
          <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-700" aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-slate-700 dark:text-zinc-300">
          <p className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            <FiClock className="text-indigo-600 dark:text-indigo-500" /> 15 phút • 20 câu • Mix Listening & Reading
          </p>
          <p>
            Bạn muốn làm bài <strong>Placement Test</strong> để xem nhanh trình độ hiện tại không? Hoàn thành bài kiểm tra, hệ thống sẽ gợi ý <strong>lộ trình học phù hợp</strong> cho bạn.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-5 py-4 dark:border-zinc-700">
          <button onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600">
            Để sau
          </button>
          <button onClick={onStart} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">
            Làm ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [openPrompt, setOpenPrompt] = React.useState(false);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const force = params.get("placement") === "1";

      const key = "placement_prompt_last_seen";
      const last = localStorage.getItem(key);
      const now = Date.now();

      const coolDownMs = 24 * 60 * 60 * 1000;
      const shouldOpen = force || !last || now - Number(last) > coolDownMs;

      if (shouldOpen) {
        setOpenPrompt(true);
      }
    } catch (e) {
      setOpenPrompt(true);
    }
  }, []);

  const handleClose = React.useCallback(() => {
    try {
      localStorage.setItem("placement_prompt_last_seen", String(Date.now()));
    } catch (e) {}
    setOpenPrompt(false);
  }, []);

  const handleStart = React.useCallback(() => {
    try {
      localStorage.setItem("placement_prompt_last_seen", String(Date.now()));
    } catch (e) {}
    window.location.href = "/placement-test";
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-[360px] bg-[radial-gradient(600px_200px_at_50%_-50px,rgba(99,102,241,0.20),transparent)] dark:bg-[radial-gradient(600px_200px_at_50%_-50px,rgba(99,102,241,0.10),transparent)]" />

      <PlacementPrompt open={openPrompt} onClose={handleClose} onStart={handleStart} />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-24 pb-5 sm:px-6 md:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-sky-700 dark:border-indigo-900/50 dark:bg-zinc-800 dark:text-sky-400">
            <FiShield /> Cấu trúc bám sát đề thật • Phân tích chi tiết
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 md:text-6xl">
            Xác định trình độ trong <span className="text-sky-500 dark:text-sky-400">15 phút</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-zinc-400 md:text-lg">
            Placement Test 20 câu (Listening/Reading) giúp ước lượng điểm hiện tại và đề xuất lộ trình học cá nhân hoá. Sau đó, bạn có thể luyện các bộ đề bám sát đề thật, mô phỏng phòng thi và chấm điểm tức thì.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={handleStart} className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white hover:bg-sky-400">
              <FiPlayCircle /> Làm Placement Test
            </button>
            <Link href="/tests" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
              Xem bộ đề <FiArrowRight />
            </Link>
            <Link href="/practice" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
              Bắt đầu luyện ngay
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center md:max-w-md">
            <Stat number="1,200+" label="Đề & bài tập" />
            <Stat number="95%" label="Độ chính xác" />
            <Stat number="150k+" label="Người học" />
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-zinc-500">
            * Hoàn thành bài kiểm tra để nhận bản <span className="font-semibold dark:text-zinc-400">đánh giá trình độ</span> và <span className="font-semibold dark:text-zinc-400">lộ trình cá nhân hoá</span> qua email.
          </p>
        </div>

        {/* Mock panel minh hoạ – khách quan */}
        <div className="relative">
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="rounded-xl bg-slate-900 p-4 text-white dark:bg-black">
              <div className="mb-3 flex items-center justify-between text-xs opacity-70">
                <span>Placement Test</span>
                <span>15 phút • 20 câu</span>
              </div>
              <div className="rounded-lg bg-white p-4 text-slate-900 dark:bg-zinc-800">
                <div className="mb-4">
                  <p className="text-sm font-semibold dark:text-zinc-100">Cấu hình khách quan</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-zinc-700">
                      <FiHeadphones className="mt-1 text-sky-500" />
                      <div>
                        <div className="font-medium dark:text-zinc-100">Phân bố câu hỏi</div>
                        <div className="text-xs text-slate-600 dark:text-zinc-400">Listening: 10 • Reading: 10 (ngẫu nhiên từ ngân hàng câu hỏi)</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-zinc-700">
                      <FiCheckCircle className="mt-1 text-emerald-500" />
                      <div>
                        <div className="font-medium dark:text-zinc-100">Chấm điểm tự động</div>
                        <div className="text-xs text-slate-600 dark:text-zinc-400">Mỗi câu 5 điểm • Không trừ điểm • Quy đổi thang TOEIC nội bộ</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-zinc-700">
                      <FiBookOpen className="mt-1 text-amber-500" />
                      <div>
                        <div className="font-medium dark:text-zinc-100">Thời gian & kiểm soát</div>
                        <div className="text-xs text-slate-600 dark:text-zinc-400">Timer 15:00 • Một lần làm • Chống mở tab audio ngoài</div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Phân bố kỹ năng</p>
                  <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full border border-slate-200 dark:border-zinc-600">
                    <div className="h-full w-1/2 bg-sky-500" title="Listening 50%" />
                    <div className="h-full w-1/2 bg-amber-400" title="Reading 50%" />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500 dark:text-zinc-500">
                    <span>Listening 50%</span>
                    <span>Reading 50%</span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3 dark:border-zinc-700">
                  <p className="text-sm font-semibold dark:text-zinc-100">Chấm điểm minh bạch</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                    Hệ thống báo cáo <span className="font-medium dark:text-zinc-200">số câu đúng</span>, <span className="font-medium dark:text-zinc-200">thời gian hoàn thành</span> và
                    <span className="font-medium dark:text-zinc-200">phân tích theo kỹ năng</span>. Không đưa ra dự đoán chủ quan, chỉ hiển thị số liệu khách quan.
                  </p>
                </div>

                <button onClick={handleStart} className="mt-4 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-400">
                  Bắt đầu Placement Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
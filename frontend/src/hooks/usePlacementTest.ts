/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, Stimulus, TestDef, ChoiceId } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

const levelLabel: Record<1 | 2 | 3 | 4, string> = {
  1: "Level 1 - Cơ bản",
  2: "Level 2 - Trung cấp",
  3: "Level 3 - Khá",
  4: "Level 4 - Nâng cao",
};

const levelToastClass: Record<1 | 2 | 3 | 4, string> = {
  1: "border-emerald-300 bg-emerald-50 text-emerald-700",
  2: "border-blue-300 bg-blue-50 text-blue-700",
  3: "border-violet-300 bg-violet-50 text-violet-700",
  4: "border-amber-300 bg-amber-50 text-amber-700",
};

export function usePlacementTest() {
  const [def, setDef] = useState<TestDef | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [resp, setResp] = useState<GradeResp | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  const { refresh } = useAuth(); // để cập nhật user.level trên UI ngay sau submit

  // Timer (tăng khi chưa có resp)
  useEffect(() => {
    if (resp) return;
    const id = setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [resp]);

  // Load định nghĩa test + items
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const td: TestDef = await fetch("/api/placement/test", {
          credentials: "include",
          cache: "no-store",
        }).then((r) => r.json());
        if (!mounted) return;
        setDef(td);

        const ids: string[] = [];
        for (const sec of td.sections) {
          for (const arr of Object.values(sec.parts)) ids.push(...arr);
        }

        const data = await fetch("/api/placement/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ids }),
        }).then((r) => r.json());

        let its: Item[] = data.items || [];
        its = its.sort((a, b) => {
          const ao = (a as any).order ?? null;
          const bo = (b as any).order ?? null;
          if (ao != null && bo != null) return ao - bo;
          return a.id.localeCompare(b.id);
        });

        if (!mounted) return;
        setItems(its);
        setStimulusMap(data.stimulusMap || {});
      } catch (e) {
        console.error("Load placement failed", e);
        toast.error("Không tải được đề kiểm tra");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const total = items.length;
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  async function submit() {
    if (!def) return;

    const res = await fetch("/api/placement/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        testId: def.testId,
        answers,
        timeSec,
        allIds: items.map((it) => it.id), // chấm cả câu bỏ trống
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast.error("Vui lòng đăng nhập trước khi nộp bài");
      } else {
        toast.error(err?.message || "Nộp bài thất bại");
      }
      return;
    }

    const r: GradeResp = await res.json();
    setResp(r);
    setShowDetails(false);

    // Toast chúc mừng
    const level = (r.level ?? 1) as 1 | 2 | 3 | 4;
    toast.success(
      `Bạn đã đạt ${levelLabel[level]} (${Math.round(r.acc * 100)}% chính xác)`,
      {
        classNames: {
          toast: `border ${levelToastClass[level]}`,
        },
        duration: 8000, // 👈 giữ 8 giây
      }
    );

    // Confetti nhẹ nếu level >= 3
    if (level >= 3) {
      confetti({
        particleCount: level === 4 ? 160 : 110,
        spread: level === 4 ? 80 : 65,
        startVelocity: 28,
        origin: { y: 0.3 },
      });
    }

    // Cập nhật user trong context (để menu hiển thị level mới)
    try {
      await refresh();
    } catch {
      // ignore
    }
  }

  return {
    def,
    items,
    stimulusMap,
    answers,
    setAnswers,
    resp,
    setResp,
    timeSec,
    setTimeSec,
    showDetails,
    setShowDetails,
    loading,
    submit,
    total,
    answered,
    started,
    setStarted,
  };
}

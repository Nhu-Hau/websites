// frontend/src/hooks/useProgressTest.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, Stimulus, ChoiceId } from "@/types/tests";
import type { GradeResp } from "@/types/placement"; // dùng lại type kết quả
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

export type UseProgressTestReturn = {
  items: Item[];
  stimulusMap: Record<string, Stimulus>;
  answers: Record<string, ChoiceId>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, ChoiceId>>>;
  resp: GradeResp | null;
  setResp: React.Dispatch<React.SetStateAction<GradeResp | null>>;
  timeSec: number;
  setTimeSec: React.Dispatch<React.SetStateAction<number>>;
  showDetails: boolean;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  submit: () => Promise<void>;
  total: number;
  answered: number;
  started: boolean;
  setStarted: React.Dispatch<React.SetStateAction<boolean>>;
  version: number | null;
};

export function useProgressTest(): UseProgressTestReturn {
  const [items, setItems] = useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [resp, setResp] = useState<GradeResp | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [version, setVersion] = useState<number | null>(null);

  const { refresh } = useAuth();

  // timer
  useEffect(() => {
    if (resp) return;
    const id = setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [resp]);

  // load paper
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // bạn có thể truyền limit qua query (?p1=4...) nếu muốn
        const data = await fetch("/api/progress/paper", {
          credentials: "include",
          cache: "no-store",
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
        const v = Number(data?.meta?.test);
        setVersion(Number.isFinite(v) ? v : 1);
      } catch (e) {
        console.error("Load progress paper failed", e);
        toast.error("Không tải được đề Progress");
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

  // submit
  async function submit() {
    const res = await fetch("/api/progress/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        answers,
        timeSec,
        allIds: items.map((it) => it.id),
        version,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(
        res.status === 401
          ? "Vui lòng đăng nhập trước khi nộp bài"
          : err?.message || "Nộp bài thất bại"
      );
      return;
    }

    const r: GradeResp = await res.json();
    setResp(r);
    setShowDetails(false);

    const est = (r as any)?.predicted?.overall ?? null;
    const acc = Math.round(((r as any)?.acc || 0) * 100);

    if (est) {
      toast.success(`Progress • TOEIC ước lượng: ${est} điểm (${acc}%)`, {
        classNames: {
          toast:
            "border border-blue-300 bg-blue-50 text-blue-700 font-semibold",
        },
        duration: 3500,
      });
      if (est >= 800) {
        confetti({
          particleCount: 120,
          spread: 70,
          startVelocity: 26,
          origin: { y: 0.3 },
        });
      }
    } else {
      toast.success(`Hoàn thành Progress (${acc}% chính xác)`, {
        classNames: {
          toast:
            "border border-blue-300 bg-blue-50 text-blue-700 font-semibold",
        },
      });
    }

    try {
      await refresh();
    } catch {
      /* ignore */
    }
  }

  return {
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
    version,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, Stimulus, ChoiceId } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

type TestDef = {
  testId: string;
  sections: { parts: Record<string, string[]> }[];
};

export type UsePlacementTestReturn = {
  def: TestDef | null;
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
};

export function usePlacementTest(): UsePlacementTestReturn {
  const [def, setDef] = useState<TestDef | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [resp, setResp] = useState<GradeResp | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  const { refresh } = useAuth();

  // ⏱️ đếm thời gian
  useEffect(() => {
    if (resp) return;
    const id = setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [resp]);

  // 📦 tải đề kiểm tra
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
          const partArrays = Object.values(sec.parts) as string[][];
          for (const arr of partArrays) ids.push(...arr);
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

  // 🧠 Nộp bài
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
        allIds: items.map((it) => it.id),
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

    const estScore = (r as any)?.estimatedToeic ?? null;
    const acc = Math.round((r as any)?.acc * 100);

    if (estScore) {
      toast.success(`🎯 Điểm TOEIC ước lượng: ${estScore} điểm (${acc}% chính xác)`, {
        classNames: {
          toast: "border border-blue-300 bg-blue-50 text-blue-700 font-semibold",
        },
        duration: 3500,
      });

      if (estScore >= 800) {
        confetti({
          particleCount: 120,
          spread: 70,
          startVelocity: 26,
          origin: { y: 0.3 },
        });
      }
    } else {
      toast.success(`Hoàn thành bài kiểm tra (${acc}% chính xác)`, {
        classNames: {
          toast: "border border-blue-300 bg-blue-50 text-blue-700 font-semibold",
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
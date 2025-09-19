/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, Stimulus, TestDef, ChoiceId } from "@/types/tests";
import type { GradeResp } from "../types/placement";

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

  // Timer
  useEffect(() => {
    if (resp) return;
    const id = setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [resp]);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const td: TestDef = await fetch("/api/placement/test").then((r) =>
          r.json()
        );
        if (!mounted) return;
        setDef(td);

        const ids: string[] = [];
        for (const sec of td.sections) {
          for (const arr of Object.values(sec.parts)) ids.push(...arr);
        }

        const data = await fetch("/api/placement/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }).then((r) => r.json());

        let its: Item[] = data.items || [];
        its = its.sort((a, b) => {
          // ưu tiên order nếu có
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
    const r: GradeResp = await fetch("/api/placement/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId: def.testId, answers, timeSec }),
    }).then((res) => res.json());
    setResp(r);
    setShowDetails(false);
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

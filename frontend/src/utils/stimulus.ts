import type { Item } from "@/types/tests.types";

export function buildFirstIndexByStimulus(items: Item[]) {
  const m = new Map<string, number>();
  items.forEach((it, idx) => {
    if (it.stimulusId && !m.has(it.stimulusId)) m.set(it.stimulusId, idx);
  });
  return m;
}
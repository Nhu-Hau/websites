import type { Item, Stimulus } from "@/types/tests";

/** Một nhóm Stimulus + danh sách Item con (hoặc single item nếu không có stimulusId) */
export type StimulusGroup = {
  key: string;                 // stimulusId hoặc __single_<itemId>
  stimulus?: Stimulus | null;  // undefined/null nếu item đơn lẻ
  items: Item[];
  indexStart: number;          // chỉ số câu đầu tiên trong nhóm (theo thứ tự toàn bài, 0-based)
};

/** Gom theo stimulusId, giữ nguyên thứ tự xuất hiện */
export function groupByStimulus(
  items: Item[],
  stimulusMap: Record<string, Stimulus>
): { groups: StimulusGroup[]; itemIndexMap: Map<string, number> } {
  const groups: StimulusGroup[] = [];
  const seen = new Map<string, number>();
  const itemIndexMap = new Map<string, number>(); // itemId -> index (0-based)

  items.forEach((it, globalIdx) => {
    itemIndexMap.set(it.id, globalIdx);

    const key = it.stimulusId ? it.stimulusId : `__single_${it.id}`;

    if (seen.has(key)) {
      const gi = seen.get(key)!;
      groups[gi].items.push(it);
    } else {
      const gi = groups.length;
      seen.set(key, gi);
      groups.push({
        key,
        stimulus: it.stimulusId ? (stimulusMap[it.stimulusId] ?? null) : null,
        items: [it],
        indexStart: globalIdx,
      });
    }
  });

  return { groups, itemIndexMap };
}
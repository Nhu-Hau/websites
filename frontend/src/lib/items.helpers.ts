// Helper cho Item: lọc theo testId, partId, lấy count, v.v.
import type { PartId } from "@/app/types/testTypes";
import type { Item } from "@/app/types/testItemTypes";
import { ITEMS_BY_TEST } from "./data/items.mock";

// Lấy tất cả item của 1 test
export function getItemsByTest(testId: string): ReadonlyArray<Item> {
  return ITEMS_BY_TEST[testId] ?? [];
}

// Lấy item theo test + part
export function getItemsByTestAndPart(testId: string, part: PartId): ReadonlyArray<Item> {
  return getItemsByTest(testId).filter((it) => it.part === part);
}

// Tổng số item của test theo part
export function countItemsByTestAndPart(testId: string, part: PartId): number {
  return getItemsByTestAndPart(testId, part).length;
}

/**
 * Helper functions (logic cho UI)
 * Công dụng:
 *  - Truy vấn dữ liệu từ constants
 *  - Tách logic khỏi component → dễ thay thế DB sau này
 */

import type {
  AccessTier,
  PartId,
  PartMeta,
  SectionId,
  Test,
} from "@/app/types/testTypes";
import { PARTS, TESTS, TEST_STRUCTURE } from "./data/toeic.constants";

/* ----------------------------- TEST HELPERS ------------------------------ */
// Lấy tất cả test
export function getAllTests(): ReadonlyArray<Test> {
  return TESTS;
}

// Tìm test theo id
export function getTestById(id: string): Test | undefined {
  return TESTS.find((t) => t.id === id);
}

// Tạm thời mọi test đều đủ Part 1..7
export function getTestsForPart(_part: PartId): ReadonlyArray<Test> {
  return TESTS;
}
// Lọc test theo quyền truy cập
export function getTestsByAccess(access: AccessTier): ReadonlyArray<Test> {
  return TESTS.filter((t) => t.access === access);
}

// Lấy access tier của test
export function getTestAccess(id: string): AccessTier | undefined {
  return getTestById(id)?.access;
}

/* ----------------------------- PART HELPERS ------------------------------ */
// Lấy metadata 1 part
export function getPartMeta(part: PartId): PartMeta {
  return PARTS[part];
}

// Lấy số câu của 1 part
export function getPartQuestionCount(part: PartId): number {
  return PARTS[part].questionCount;
}

// Lấy Section (Listening/Reading) của part
export function getPartSection(part: PartId): SectionId {
  return PARTS[part].section;
}

// Tạo tên hiển thị (VD: "Part 1: Photographs")
export function getPartDisplayName(part: PartId): string {
  const p = PARTS[part];
  return `${p.title}: ${p.name}`;
}

// Kiểm tra 1 part có thuộc Listening không
export function isListeningPart(part: PartId): boolean {
  return PARTS[part].section === "Listening";
}

// Lấy toàn bộ parts Listening
export function getListeningParts() {
  return Object.values(TEST_STRUCTURE.parts).filter(
    (p) => p.section === "Listening"
  );
}

// Lấy toàn bộ parts Reading
export function getReadingParts() {
  return Object.values(TEST_STRUCTURE.parts).filter(
    (p) => p.section === "Reading"
  );
}

// Lấy tất cả parts
export function getAllParts() {
  return Object.values(TEST_STRUCTURE.parts);
}

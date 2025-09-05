/**
 * Mock TOEIC data (const chỉ đọc, dùng làm seed hoặc hiển thị UI)
 * Công dụng:
 *  - Lưu metadata tĩnh về Section, Part, Test
 *  - Không chứa logic, chỉ dữ liệu gốc
 */

import type {
  PartId,
  SectionId,
  PartMeta,
  SectionMeta,
  Test,
  TestStructure,
} from "@/app/types/testTypes";

/* ------------------------------- SECTIONS -------------------------------- */
// Metadata cho Listening và Reading
export const SECTIONS = Object.freeze<Record<SectionId, SectionMeta>>({
  LISTENING: { id: "LISTENING", totalQuestions: 100, durationMin: 45 },
  READING: { id: "READING", totalQuestions: 100, durationMin: 75 },
});

//Hàm Object.freeze trong JavaScript đóng băng object
//Record<K, V> nghĩa là: object có key thuộc kiểu K và value thuộc kiểu V

/* --------------------------------- PARTS --------------------------------- */
// Metadata cho từng Part (theo TOEIC mới)
export const PARTS = Object.freeze<Record<PartId, PartMeta>>({
  1: {
    id: 1,
    title: "Part 1",
    name: "Mô tả tranh",
    section: "Listening" as SectionId,
    questionCount: 6,
  },
  2: {
    id: 2,
    title: "Part 2",
    name: "Hỏi - đáp",
    section: "Listening" as SectionId,
    questionCount: 25,
  },
  3: {
    id: 3,
    title: "Part 3",
    name: "Đoạn hội thoại",
    section: "Listening" as SectionId,
    questionCount: 39,
  },
  4: {
    id: 4,
    title: "Part 4",
    name: "Bài nói ngắn",
    section: "Listening" as SectionId,
    questionCount: 30,
  },
  5: {
    id: 5,
    title: "Part 5",
    name: "Hoàn thành câu",
    section: "Reading" as SectionId,
    questionCount: 30,
  },
  6: {
    id: 6,
    title: "Part 6",
    name: "Hoàn thành đoạn văn",
    section: "Reading" as SectionId,
    questionCount: 16,
  },
  7: {
    id: 7,
    title: "Part 7",
    name: "Đọc hiểu",
    section: "Reading" as SectionId,
    questionCount: 54,
  },
});

/* ---------------------------- TEST STRUCTURE ----------------------------- */
// Tổng hợp sections + parts → cấu trúc đề TOEIC
export const TEST_STRUCTURE: TestStructure = {
  totalQuestions:
    SECTIONS.LISTENING.totalQuestions + SECTIONS.READING.totalQuestions, // 200
  sections: SECTIONS,
  parts: PARTS,
};

// Tổng số phút toàn bài
export const TOTAL_DURATION_MIN =
  SECTIONS.LISTENING.durationMin + SECTIONS.READING.durationMin; // 120

// Tổng số câu toàn bài
export const TOTAL_QUESTIONS =
  SECTIONS.LISTENING.totalQuestions + SECTIONS.READING.totalQuestions; // 200

/* ---------------------------------- TESTS -------------------------------- */
// Mock danh sách 10 đề (5 free, 5 pro)
export const TESTS = Object.freeze<Test[]>([
  {
    id: "TOEIC-001",
    title: "TEST 1",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-002",
    title: "TEST 2",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-003",
    title: "TEST 3",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-004",
    title: "TEST 4",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-005",
    title: "TEST 5",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-006",
    title: "TEST 6",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-007",
    title: "TEST 7",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-008",
    title: "TEST 8",
    access: "free",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-009",
    title: "TEST 9",
    access: "pro",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
  {
    id: "TOEIC-010",
    title: "TEST 10",
    access: "pro",
    durationMin: TOTAL_DURATION_MIN,
    totalQuestions: TOTAL_QUESTIONS,
  },
]);

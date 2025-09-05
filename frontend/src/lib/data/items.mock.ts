// Mock tối thiểu cho 2 đề đầu. FE render được ngay.
// Khi cần, nhân bản pattern này cho TOEIC-003..010.

import type { Item } from "@/app/types/testItemTypes";

export const ITEMS_BY_TEST: Record<string, ReadonlyArray<Item>> = {
  "TOEIC-001": [
    // ---- Part 1
    {
      id: "T1-P1-01",
      testId: "TOEIC-001",
      part: 1,
      imageUrl: "/assets/t1/p1/01.jpg",
      statements: [
        { key: "A", text: "A woman is typing on a keyboard." },
        { key: "B", text: "A man is watering the plants." },
        { key: "C", text: "Books are stacked on a shelf." },
        { key: "D", text: "People are crossing the street." },
      ],
      answer: "A",
    },
    // ---- Part 2
    {
      id: "T1-P2-01",
      testId: "TOEIC-001",
      part: 2,
      audioUrl: "/assets/t1/p2/01_q.mp3",
      choices: [
        { key: "A", audioUrl: "/assets/t1/p2/01_a.mp3" },
        { key: "B", audioUrl: "/assets/t1/p2/01_b.mp3" },
        { key: "C", audioUrl: "/assets/t1/p2/01_c.mp3" },
      ],
      answer: "B",
    },
    // ---- Part 3
    {
      id: "T1-P3-01",
      testId: "TOEIC-001",
      part: 3,
      audioUrl: "/assets/t1/p3/01.mp3",
      qas: [
        {
          id: "Q1",
          question: "What are the speakers discussing?",
          choices: [
            { key: "A", text: "A project deadline" },
            { key: "B", text: "A client visit" },
            { key: "C", text: "A job interview" },
            { key: "D", text: "A product recall" },
          ],
          answer: "A",
        },
        {
          id: "Q2",
          question: "When is the meeting?",
          choices: [
            { key: "A", text: "Monday" },
            { key: "B", text: "Tuesday" },
            { key: "C", text: "Wednesday" },
            { key: "D", text: "Friday" },
          ],
          answer: "C",
        },
        {
          id: "Q3",
          question: "What will the man do next?",
          choices: [
            { key: "A", text: "Send an email" },
            { key: "B", text: "Call the client" },
            { key: "C", text: "Reserve a room" },
            { key: "D", text: "Print documents" },
          ],
          answer: "C",
        },
      ],
    },
    // ---- Part 4
    {
      id: "T1-P4-01",
      testId: "TOEIC-001",
      part: 4,
      audioUrl: "/assets/t1/p4/01.mp3",
      qas: [
        {
          id: "Q1",
          question: "What is the announcement about?",
          choices: [
            { key: "A", text: "A schedule change" },
            { key: "B", text: "A price increase" },
            { key: "C", text: "A product recall" },
            { key: "D", text: "A canceled event" },
          ],
          answer: "A",
        },
        {
          id: "Q2",
          question: "Who is the target audience?",
          choices: [
            { key: "A", text: "Customers" },
            { key: "B", text: "Suppliers" },
            { key: "C", text: "Shareholders" },
            { key: "D", text: "New hires" },
          ],
          answer: "A",
        },
        {
          id: "Q3",
          question: "What will happen next?",
          choices: [
            { key: "A", text: "A website update" },
            { key: "B", text: "A press release" },
            { key: "C", text: "A refund" },
            { key: "D", text: "An inspection" },
          ],
          answer: "B",
        },
      ],
    },
    // ---- Part 5
    {
      id: "T1-P5-01",
      testId: "TOEIC-001",
      part: 5,
      sentence: "The report will be ___ tomorrow.",
      choices: [
        { key: "A", text: "submit" },
        { key: "B", text: "submitting" },
        { key: "C", text: "submitted" },
        { key: "D", text: "to submit" },
      ],
      answer: "C",
    },
    // ---- Part 6
    {
      id: "T1-P6-01",
      testId: "TOEIC-001",
      part: 6,
      passage:
        "We would like to [[B1]] all employees to the annual retreat. The venue has [[B2]] facilities and meals will be [[B3]] by the hotel. Please [[B4]] early.",
      blanks: [
        {
          id: "B1",
          choices: [
            { key: "A", text: "invite" },
            { key: "B", text: "invites" },
            { key: "C", text: "inviting" },
            { key: "D", text: "invited" },
          ],
          answer: "A",
        },
        {
          id: "B2",
          choices: [
            { key: "A", text: "extend" },
            { key: "B", text: "extended" },
            { key: "C", text: "extensive" },
            { key: "D", text: "extent" },
          ],
          answer: "C",
        },
        {
          id: "B3",
          choices: [
            { key: "A", text: "provide" },
            { key: "B", text: "provided" },
            { key: "C", text: "provision" },
            { key: "D", text: "provider" },
          ],
          answer: "B",
        },
        {
          id: "B4",
          choices: [
            { key: "A", text: "register" },
            { key: "B", text: "registers" },
            { key: "C", text: "registered" },
            { key: "D", text: "registering" },
          ],
          answer: "A",
        },
      ],
    },
    // ---- Part 7
    {
      id: "T1-P7-01",
      testId: "TOEIC-001",
      part: 7,
      passages: [
        { id: "P1", html: "<p>Dear Customer, Your order #1245 will arrive...</p>" },
        { id: "P2", html: "<p>Tracking information: ...</p>" },
      ],
      qas: [
        {
          id: "Q1",
          question: "What is the purpose of the e-mail?",
          choices: [
            { key: "A", text: "To refund a purchase" },
            { key: "B", text: "To confirm shipment" },
            { key: "C", text: "To request feedback" },
            { key: "D", text: "To cancel an order" },
          ],
          answer: "B",
        },
      ],
    },
  ],

  "TOEIC-002": [
    // Thêm vài mẫu khác nhau để test UI
    {
      id: "T2-P1-01",
      testId: "TOEIC-002",
      part: 1,
      imageUrl: "/assets/t2/p1/01.jpg",
      statements: [
        { key: "A", text: "The chairs are arranged in rows." },
        { key: "B", text: "The tables are being moved." },
        { key: "C", text: "The floor is being cleaned." },
        { key: "D", text: "The lights are turned off." },
      ],
      answer: "A",
    },
    {
      id: "T2-P5-01",
      testId: "TOEIC-002",
      part: 5,
      sentence: "Employees must wear ID badges while ___ the building.",
      choices: [
        { key: "A", text: "enter" },
        { key: "B", text: "entered" },
        { key: "C", text: "entering" },
        { key: "D", text: "to enter" },
      ],
      answer: "C",
    },
  ],
};

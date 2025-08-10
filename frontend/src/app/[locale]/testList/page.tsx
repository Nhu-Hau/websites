"use client";

import React, { useState } from "react";
import TestYearTabs from "../../components/common/TestYearTabs";
import TestCard from "../../components/common/TestCard";

const TESTS = [
  {
    year: 2018,
    title: "TOEIC Practice Test 1",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 2",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 3",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 4",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 5",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 6",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 7",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 8",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 9",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2018,
    title: "TOEIC Practice Test 10",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
  {
    year: 2019,
    title: "TOEIC Practice Test 2",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
  },
];

export default function TestList() {
  const [selectedYear, setSelectedYear] = useState<number>(2018);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const filteredTests = TESTS.filter((test) => test.year === selectedYear);

  return (
    <div className="py-32 flex flex-col px-4 sm:px-8 md:px-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500 min-h-screen">
      <div className="text-4xl font-bold mb-4 text-center">
        TOEIC EST Practice Test List
      </div>

      <TestYearTabs onChangeYear={handleYearChange} />

      <div className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTests.length > 0 ? (
            filteredTests.map((test, idx) => (
              <TestCard key={test.title + idx} test={test} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No tests available for {selectedYear}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

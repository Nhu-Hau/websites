"use client";

import React, { useState } from "react";
import TestYearTabs from "../../components/common/TestYearTabs";
import TestCard from "@/app/components/common/TestCard";

const TEST_HISTORY = [
  {
    year: 2018,
    title: "TOEIC Practice Test 1",
    description:
      "Start your TOEIC journey with authentic 2024-format questions. This test covers all question types, helping you get familiar with the real exam structure and timing.",
    duration: "120 minutes",
    questions: 200,
    completed: true,
    score: 830,
    completedAt: "2024-06-10",
  },
];

export default function TestHistory() {
  const [selectedYear, setSelectedYear] = useState<number>(2018);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const filteredHistory = TEST_HISTORY.filter(
    (test) => test.year === selectedYear
  );

  return (
    <div className="py-32 flex flex-col px-4 sm:px-8 md:px-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen transition-colors duration-300">
      <div className="text-4xl font-bold mb-4 text-center">Test History</div>

      <TestYearTabs onChangeYear={handleYearChange} />

      <div className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((test, idx) => (
              <TestCard key={test.title + idx} test={test} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No test history for {selectedYear}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";

interface TestYearTabsProps {
  onChangeYear: (year: number) => void;
}

const TestYearTabs: React.FC<TestYearTabsProps> = ({ onChangeYear }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2018);

  const handleTabClick = (year: number) => {
    setSelectedYear(year);
    onChangeYear(year);
  };

  const years = Array.from({ length: 7 }, (_, index) => 2018 + index);

  return (
    <div className="relative z-10 mx-auto w-full max-w-screen-xl flex flex-col sm:flex-row xs:items-center xs:justify-between gap-6 px-2 sm:px-4 py-3 sm:py-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center gap-3 justify-center xs:justify-start">
        <div className="flex items-center gap-2 bg-[#EFF8FF] dark:bg-gray-700 border border-[#334e99] px-3 py-2 rounded-xl font-semibold text-[#334e99] dark:text-white text-base sm:text-lg shadow-sm whitespace-nowrap">
          <CalendarClock size={20} className="text-[#334e99] dark:text-white" />
          TOEIC TEST EST :
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center items-center">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleTabClick(year)}
            className={`
              px-3 xs:px-4 py-2 rounded-lg font-medium text-sm sm:text-base
              transition-all duration-300 border
              flex items-center gap-2
              ${
                selectedYear === year
                  ? "bg-[#35509A] dark:bg-blue-900 text-white border-[#35509A] shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white border-transparent hover:border-blue-500 hover:bg-[#EFF8FF] dark:hover:bg-gray-600 hover:text-[#334e99] dark:hover:text-white"
              }
            `}
          >
            <CalendarClock
              size={16}
              className={`inline-block ${
                selectedYear === year ? "text-white" : "text-[#334e99] dark:text-white"
              }`}
            />
            <span>{year}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestYearTabs;

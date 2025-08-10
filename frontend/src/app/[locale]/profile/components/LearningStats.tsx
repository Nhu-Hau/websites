"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaChartLine } from "react-icons/fa";

const mockProgressData = [
  { date: "07/25", listening: 50, reading: 60 },
  { date: "07/26", listening: 60, reading: 65 },
  { date: "07/27", listening: 70, reading: 75 },
  { date: "07/28", listening: 80, reading: 85 },
];

const LearningStats = () => {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 w-full max-w-5xl mx-auto mt-10 transition-colors duration-300">
      {/* Tiêu đề */}
      <div className="text-xl sm:text-2xl font-bold mb-4 text-tealCustom dark:text-blue-500 flex items-center gap-3">
        <FaChartLine />
        Thống kê tiến độ học tập
      </div>

      {/* Tổng kết */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
        <div className="bg-[#dbedfd] dark:bg-gray-700 rounded-lg p-4">
          <p className="text-3xl font-bold text-tealCustom dark:text-blue-500">12</p>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Bài đã hoàn thành
          </p>
        </div>
        <div className="bg-[#dbedfd] dark:bg-gray-700 rounded-lg p-4">
          <p className="text-3xl font-bold text-tealCustom dark:text-blue-500">720</p>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Điểm TOEIC trung bình
          </p>
        </div>
        <div className="bg-[#dbedfd] dark:bg-gray-700 rounded-lg p-4">
          <p className="text-3xl font-bold text-tealCustom dark:text-blue-500">5 giờ</p>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Tổng thời gian học
          </p>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockProgressData}>
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderColor: "#ccc",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#444" }}
              itemStyle={{ color: "#444" }}
            />
            <Line
              type="monotone"
              dataKey="listening"
              stroke="#2c5858"
              name="Listening"
            />
            <Line
              type="monotone"
              dataKey="reading"
              stroke="#35509A"
              name="Reading"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default LearningStats;

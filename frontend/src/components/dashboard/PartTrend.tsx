"use client";

import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export type TrendPoint = { x: string; acc: number }; // acc: 0..100 (%)

export default function PartTrend({
  data,
  height = 120,
}: {
  data: TrendPoint[];
  height?: number;
}) {
  // Nếu ít điểm quá thì show placeholder
  if (!data?.length) {
    return (
      <div className="h-[120px] flex items-center justify-center text-xs text-zinc-500">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, "Độ chính xác"]}
            labelFormatter={(l) => `Lần: ${l}`}
          />
          <Line
            type="monotone"
            dataKey="acc"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
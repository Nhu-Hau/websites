"use client";

import React from "react";
import { adminOverview, adminUserScores } from "@/lib/apiClient";

export default function Home() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [data, setData] = React.useState<{ totalUsers: number; avgOverall: number; byLevel: Record<string, number>; histogram: { min: number; max: number; count: number }[] } | null>(null);
  const [userScores, setUserScores] = React.useState<Array<{ _id: string; name: string; email: string; level: number; overall: number; listening: number; reading: number; submittedAt: string }>>([]);
  const [error, setError] = React.useState<string|undefined>(undefined);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setMe({ id: j?.id, role: j?.role });
        } else {
          setMe(null);
        }
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== 'admin') return;
      try {
        const [overview, scores] = await Promise.all([
          adminOverview(),
          adminUserScores()
        ]);
        const byLevel = (overview.byLevel as any);
        setData({ totalUsers: overview.totalUsers, avgOverall: overview.avgOverall, byLevel, histogram: overview.histogram });
        setUserScores(scores.users);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải dữ liệu');
      }
    })();
  }, [me]);

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  const bars = data?.histogram || [];
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const width = 600, height = 220, pad = 24;
  const bw = (width - pad * 2) / (bars.length || 1);

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Tổng quan điểm người dùng</h1>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <div className="text-sm text-zinc-500">Số user có điểm</div>
          <div className="text-2xl font-semibold">{data?.totalUsers ?? 0}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-zinc-500">Điểm TOEIC TB</div>
          <div className="text-2xl font-semibold">{data?.avgOverall ?? 0}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-zinc-500">Level</div>
          <div className="text-sm">1: {data?.byLevel?.["1"] ?? 0} · 2: {data?.byLevel?.["2"] ?? 0} · 3: {data?.byLevel?.["3"] ?? 0} · 4: {data?.byLevel?.["4"] ?? 0}</div>
        </div>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm text-zinc-600 mb-2">Phân phối điểm (0-1000)</div>
        <svg width={width} height={height} className="block">
          {bars.map((b, i) => {
            const h = Math.round(((b.count || 0) / maxCount) * (height - pad * 2));
            const x = pad + i * bw;
            const y = height - pad - h;
            return (
              <g key={i}>
                <rect x={x} y={y} width={bw - 8} height={h} className="fill-tealCustom" />
                <text x={x + (bw - 8) / 2} y={height - pad + 14} textAnchor="middle" className="text-[10px] fill-zinc-600">
                  {b.min}-{b.max}
                </text>
                <text x={x + (bw - 8) / 2} y={y - 4} textAnchor="middle" className="text-[10px] fill-zinc-700">
                  {b.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm text-zinc-600 mb-4">Điểm từng người dùng (sắp xếp theo điểm giảm dần)</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="p-3">Tên</th>
                <th className="p-3">Email</th>
                <th className="p-3">Level</th>
                <th className="p-3">Tổng điểm</th>
                <th className="p-3">Listening</th>
                <th className="p-3">Reading</th>
                <th className="p-3">Ngày làm</th>
              </tr>
            </thead>
            <tbody>
              {userScores.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full border text-xs bg-blue-100 text-blue-800">
                      Level {u.level}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-lg">{u.overall}</td>
                  <td className="p-3">{u.listening}</td>
                  <td className="p-3">{u.reading}</td>
                  <td className="p-3 text-xs text-zinc-500">
                    {new Date(u.submittedAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
              {userScores.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-zinc-500" colSpan={7}>Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

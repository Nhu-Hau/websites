/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { adminVpsStats, adminVpsNetworkStats } from "@/lib/apiClient";
import { Server, Activity, Wifi, Shield, ArrowDown, ArrowUp } from "lucide-react";

export default function VpsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [vpsStats, setVpsStats] = React.useState<{ cpu: number; realMemory: number; virtualMemory: number; localDiskSpace: number; os: string; uptime: string; uptimeSeconds: number } | null>(null);
  const [networkStats, setNetworkStats] = React.useState<{ rxSpeed: number; txSpeed: number; sshSessions: any[] }>({ rxSpeed: 0, txSpeed: 0, sshSessions: [] });
  const [lastNetworkBytes, setLastNetworkBytes] = React.useState<{ rx: number; tx: number; time: number } | null>(null);
  const [error, setError] = React.useState<string | undefined>(undefined);


  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", { credentials: "include", cache: "no-store" });
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

  // Fetch VPS stats
  React.useEffect(() => {
    if (me?.role !== 'admin') return;

    const fetchVpsStats = async () => {
      try {
        const stats = await adminVpsStats();
        setVpsStats(stats);
        setError(undefined);
      } catch (e: any) {
        console.error('Error fetching VPS stats:', e);
        setError(e?.message || 'Lỗi khi tải thông tin VPS');
      }
    };

    fetchVpsStats();
    const interval = setInterval(fetchVpsStats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
    return () => clearInterval(interval);
  }, [me]);

  // Fetch Network stats
  React.useEffect(() => {
    if (me?.role !== 'admin') return;

    const fetchNetwork = async () => {
      try {
        const stats = await adminVpsNetworkStats();
        const now = Date.now();

        setLastNetworkBytes(prev => {
          if (prev) {
            const timeDiff = (now - prev.time) / 1000; // seconds
            if (timeDiff > 0) {
              const rxSpeed = Math.max(0, (stats.rx - prev.rx) / timeDiff);
              const txSpeed = Math.max(0, (stats.tx - prev.tx) / timeDiff);
              setNetworkStats({ rxSpeed, txSpeed, sshSessions: stats.sshSessions });
            }
          } else {
            setNetworkStats(s => ({ ...s, sshSessions: stats.sshSessions }));
          }
          return { rx: stats.rx, tx: stats.tx, time: now };
        });
      } catch (e) {
        console.error('Error fetching network stats:', e);
      }
    };

    fetchNetwork();
    const interval = setInterval(fetchNetwork, 2000); // Refresh every 2 seconds for speed calc

    return () => clearInterval(interval);
  }, [me]);



  if (loadingMe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-zinc-600">Đang tải...</div>
      </div>
    );
  }

  if (!me || me.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-red-600">Chỉ dành cho Admin</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-50 overflow-hidden">
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Thông số VPS</h1>
            <p className="text-zinc-600 mt-1">Theo dõi hiệu suất hệ thống</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* VPS Stats */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            {vpsStats ? (
              <div className="space-y-6">
                {/* OS và Uptime Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="h-4 w-4 text-blue-700" />
                      <p className="text-sm font-medium text-blue-700">Hệ điều hành</p>
                    </div>
                    <p className="text-lg font-semibold text-blue-900">{vpsStats.os}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-green-700" />
                      <p className="text-sm font-medium text-green-700">Thời gian đã chạy</p>
                    </div>
                    <p className="text-lg font-semibold text-green-900">{vpsStats.uptime}</p>
                  </div>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <CircularGauge
                    label="CPU"
                    value={vpsStats.cpu}
                  />
                  <CircularGauge
                    label="REAL MEMORY"
                    value={vpsStats.realMemory}
                  />
                  <CircularGauge
                    label="VIRTUAL MEMORY"
                    value={vpsStats.virtualMemory}
                  />
                  <CircularGauge
                    label="LOCAL DISK SPACE"
                    value={vpsStats.localDiskSpace}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-400">Đang tải thông tin VPS...</div>
            )}
          </div>

          {/* Network & Security Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Mạng & Bảo mật</h2>
              <p className="text-zinc-600 mt-1">Giám sát lưu lượng và truy cập</p>
            </div>

            {/* Network Speed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Tốc độ Download</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900">{formatBytes(networkStats.rxSpeed)}/s</span>
                    <ArrowDown className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <Wifi className="h-6 w-6 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Tốc độ Upload</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900">{formatBytes(networkStats.txSpeed)}/s</span>
                    <ArrowUp className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* SSH Sessions */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center gap-2">
                <Shield className="h-5 w-5 text-zinc-700" />
                <h3 className="font-semibold text-zinc-900">Kết nối SSH hiện tại</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">IP Address</th>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">TTY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {networkStats.sshSessions.length > 0 ? (
                      networkStats.sshSessions.map((session, i) => (
                        <tr key={i} className="hover:bg-zinc-50">
                          <td className="px-6 py-3 font-medium text-zinc-900">{session.user}</td>
                          <td className="px-6 py-3 text-zinc-600 font-mono">{session.ip}</td>
                          <td className="px-6 py-3 text-zinc-600">{session.time}</td>
                          <td className="px-6 py-3 text-zinc-500">{session.tty}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                          Không có kết nối SSH nào (hoặc không thể lấy dữ liệu)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Circular Gauge Component
function CircularGauge({ label, value }: { label: string; value: number }) {
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const gradientId = `gradient-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-zinc-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-zinc-900">{value}%</span>
        </div>
      </div>
      {/* Label */}
      <p className="mt-4 text-sm font-medium text-zinc-700 text-center">{label}</p>
    </div>
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

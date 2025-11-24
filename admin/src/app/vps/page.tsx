/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { adminVpsStats, adminPm2Logs } from "@/lib/apiClient";
import { Server, Activity, FileText, RefreshCw } from "lucide-react";

export default function VpsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [vpsStats, setVpsStats] = React.useState<{ cpu: number; realMemory: number; virtualMemory: number; localDiskSpace: number; os: string; uptime: string; uptimeSeconds: number } | null>(null);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [pm2Logs, setPm2Logs] = React.useState<{ admin: string; frontend: string; api: string }>({ admin: '', frontend: '', api: '' });
  const [loadingLogs, setLoadingLogs] = React.useState<{ admin: boolean; frontend: boolean; api: boolean }>({ admin: false, frontend: false, api: false });

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

  // Tải thống tin VPS
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
    const interval = setInterval(fetchVpsStats, 5000); // Làm mới mỗi 5 giây

    return () => clearInterval(interval);
  }, [me]);

  // Tải PM2 logs
  const fetchPm2Logs = React.useCallback(async (app: 'admin' | 'frontend' | 'api') => {
    if (me?.role !== 'admin') return;

    setLoadingLogs(prev => ({ ...prev, [app]: true }));
    try {
      const result = await adminPm2Logs(app, 100); // Lấy 100 dòng cuối
      setPm2Logs(prev => ({ ...prev, [app]: result.logs }));
    } catch (e: any) {
      console.error(`Error fetching PM2 logs for ${app}:`, e);
      setPm2Logs(prev => ({ ...prev, [app]: `Lỗi khi tải logs: ${e?.message || 'Unknown error'}` }));
    } finally {
      setLoadingLogs(prev => ({ ...prev, [app]: false }));
    }
  }, [me]);

  // Fetch logs khi component mount
  React.useEffect(() => {
    if (me?.role !== 'admin') return;

    // Fetch logs lần đầu
    fetchPm2Logs('admin');
    fetchPm2Logs('frontend');
    fetchPm2Logs('api');

    // Refresh logs mỗi 10 giây
    const interval = setInterval(() => {
      fetchPm2Logs('admin');
      fetchPm2Logs('frontend');
      fetchPm2Logs('api');
    }, 10000);

    return () => clearInterval(interval);
  }, [me, fetchPm2Logs]);

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

          {/* PM2 Logs Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">PM2 Logs</h2>
              <p className="text-zinc-600 mt-1">Xem logs của các ứng dụng</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Admin Logs */}
              <LogViewer
                title="Admin Logs"
                app="admin"
                logs={pm2Logs.admin}
                loading={loadingLogs.admin}
                onRefresh={() => fetchPm2Logs('admin')}
              />

              {/* Frontend Logs */}
              <LogViewer
                title="Frontend Logs"
                app="frontend"
                logs={pm2Logs.frontend}
                loading={loadingLogs.frontend}
                onRefresh={() => fetchPm2Logs('frontend')}
              />

              {/* API Logs */}
              <LogViewer
                title="API Logs"
                app="api"
                logs={pm2Logs.api}
                loading={loadingLogs.api}
                onRefresh={() => fetchPm2Logs('api')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component hiển thị logs
function LogViewer({
  title,
  app,
  logs,
  loading,
  onRefresh
}: {
  title: string;
  app: string;
  logs: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  const logRef = React.useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống cuối khi logs cập nhật
  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-700" />
          <h3 className="font-semibold text-zinc-900">{title}</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh logs"
        >
          <RefreshCw className={`h-4 w-4 text-zinc-700 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs Content */}
      <div
        ref={logRef}
        className="flex-1 overflow-auto p-4 bg-zinc-900 text-zinc-100 font-mono text-xs"
        style={{ fontFamily: 'monospace' }}
      >
        {loading && !logs ? (
          <div className="text-zinc-400">Đang tải logs...</div>
        ) : logs ? (
          <pre className="whitespace-pre-wrap break-words">{logs}</pre>
        ) : (
          <div className="text-zinc-400">Không có logs</div>
        )}
      </div>
    </div>
  );
}

// Component gauge hình tròn
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

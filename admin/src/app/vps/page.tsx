/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { adminVpsStats, adminVpsNetworkStats, adminVpsDatabaseStats, adminGetProcesses, adminControlProcess } from "@/lib/apiClient";
import { Server, Activity, Wifi, Shield, ArrowDown, ArrowUp, Database, HardDrive, Play, Square, RotateCw } from "lucide-react";

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
};

export default function VpsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [vpsStats, setVpsStats] = React.useState<{ cpu: number; realMemory: number; virtualMemory: number; localDiskSpace: number; os: string; uptime: string; uptimeSeconds: number } | null>(null);
  const [networkStats, setNetworkStats] = React.useState<{ rxSpeed: number; txSpeed: number; sshSessions: any[] }>({ rxSpeed: 0, txSpeed: 0, sshSessions: [] });
  const [dbStats, setDbStats] = React.useState<{ mongo: any; s3: any } | null>(null);
  const [processes, setProcesses] = React.useState<any[]>([]);
  const [processingAction, setProcessingAction] = React.useState<string | null>(null);
  const [lastNetworkBytes, setLastNetworkBytes] = React.useState<{ rx: number; tx: number; time: number } | null>(null);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);


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

  // Fetch Database stats
  React.useEffect(() => {
    if (me?.role !== 'admin') return;
    const fetchDb = async () => {
      try {
        const stats = await adminVpsDatabaseStats();
        setDbStats(stats);
      } catch (e) {
        console.error('Error fetching DB stats:', e);
      }
    };
    fetchDb();
  }, [me]);

  // Fetch Processes
  React.useEffect(() => {
    if (me?.role !== 'admin') return;
    const fetchProcesses = async () => {
      try {
        const data = await adminGetProcesses();
        setProcesses(data);
      } catch (e) {
        console.error('Error fetching processes:', e);
      }
    };
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [me]);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      // if (confirmDialog.successMessage) {
      //   toast.success(confirmDialog.successMessage);
      // }
      setConfirmDialog(null);
    } catch (error: any) {
      alert(error.message || 'Thao tác thất bại');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleProcessAction = async (id: number, name: string, action: 'start' | 'stop' | 'restart') => {
    if (processingAction) return;

    setConfirmDialog({
      title: `Xác nhận ${action}`,
      description: `Bạn có chắc muốn ${action} process "${name}" (ID: ${id})?`,
      confirmText: action === 'restart' ? 'Restart' : action === 'stop' ? 'Stop' : 'Start',
      cancelText: "Hủy",
      onConfirm: async () => {
        setProcessingAction(`${id}-${action}`);
        try {
          await adminControlProcess(id.toString(), action);
          // Refresh list immediately
          const data = await adminGetProcesses();
          setProcesses(data);
        } catch (e: any) {
          throw e;
        } finally {
          setProcessingAction(null);
        }
      },
    });
  };


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

          {/* Database & Storage Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Database & Storage</h2>
              <p className="text-zinc-600 mt-1">Dung lượng lưu trữ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MongoDB */}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">MongoDB</h3>
                    <p className="text-xs text-zinc-500">Database chính</p>
                  </div>
                </div>

                {dbStats ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-zinc-500">Storage Size</p>
                      <p className="text-2xl font-bold text-zinc-900">{formatBytes(dbStats.mongo.storageSize)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Collections</p>
                        <p className="font-medium text-zinc-900">{dbStats.mongo.collections}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Objects</p>
                        <p className="font-medium text-zinc-900">{dbStats.mongo.objects.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-zinc-100 rounded w-1/2"></div>
                    <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                  </div>
                )}
              </div>

              {/* S3 Storage */}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <HardDrive className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">AWS S3</h3>
                    <p className="text-xs text-zinc-500">{dbStats?.s3.bucket || 'Loading...'}</p>
                  </div>
                </div>

                {dbStats ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-zinc-500">Total Size</p>
                      <p className="text-2xl font-bold text-zinc-900">{formatBytes(dbStats.s3.size)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Total Objects</p>
                      <p className="font-medium text-zinc-900">{dbStats.s3.objects.toLocaleString()}</p>
                    </div>
                    {dbStats.s3.error && (
                      <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                        Error: {dbStats.s3.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-zinc-100 rounded w-1/2"></div>
                    <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Process Management Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Quản lý Process (PM2)</h2>
              <p className="text-zinc-600 mt-1">Giám sát và điều khiển các ứng dụng</p>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">
                        <RotateCw className="h-4 w-4" />
                      </th>
                      <th className="px-6 py-3">Memory</th>
                      <th className="px-6 py-3">CPU</th>
                      <th className="px-6 py-3">Uptime</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {processes.length > 0 ? (
                      processes.map((proc) => (
                        <tr key={proc.pm_id} className="hover:bg-zinc-50">
                          <td className="px-6 py-4 text-zinc-500 font-mono">
                            {proc.pm_id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-zinc-900">{proc.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proc.pm2_env.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {proc.pm2_env.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-600 font-mono">
                            {proc.pm2_env.restart_time}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 font-mono">
                            {formatBytes(proc.monit.memory)}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 font-mono">
                            {proc.monit.cpu}%
                          </td>
                          <td className="px-6 py-4 text-zinc-600 text-xs">
                            {/* Simple uptime calc, assumes pm_uptime is timestamp */}
                            {proc.pm2_env.pm_uptime ? formatUptime(Date.now() - proc.pm2_env.pm_uptime) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleProcessAction(proc.pm_id, proc.name, 'start')}
                                disabled={!!processingAction}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Start"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleProcessAction(proc.pm_id, proc.name, 'stop')}
                                disabled={!!processingAction}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Stop"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleProcessAction(proc.pm_id, proc.name, 'restart')}
                                disabled={!!processingAction}
                                className={`p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 ${processingAction === `${proc.pm_id}-restart` ? 'animate-spin' : ''
                                  }`}
                                title="Restart"
                              >
                                <RotateCw className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-zinc-400">
                          Đang tải danh sách process...
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

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-zinc-900">{confirmDialog.title}</h3>
            <p className="text-zinc-600">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={confirmLoading}
                className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium"
              >
                {confirmDialog.cancelText || "Hủy"}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${confirmDialog.confirmText === 'Stop' ? 'bg-red-600 hover:bg-red-700' :
                    confirmDialog.confirmText === 'Restart' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {confirmLoading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {confirmDialog.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
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

function formatUptime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

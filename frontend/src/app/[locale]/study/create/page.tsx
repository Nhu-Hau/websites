'use client';
import React from 'react';
import { CreateStudyRoom } from '@/components/study/CreateStudyRoom';
import { listStudyRooms, deleteStudyRoom } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function CreateStudyRoomPage() {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = React.useState<Array<{ roomName: string; numParticipants: number; createdAt: string }>>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const p = useParams<{ locale?: string }>();
  const prefix = p?.locale ? `/${p.locale}` : '';

  // Tất cả user đều có thể tạo và xem phòng
  const canDelete = (user as any)?.role === 'admin'; // Chỉ admin mới xóa được

  const reload = React.useCallback(async () => {
    if (!user || !user.id || !user.name) return;
    try {
      setErr(null);
      const data = await listStudyRooms({ id: user.id, name: user.name, role: (user as any).role });
      setRooms(data.rooms || []);
    } catch (e: any) {
      setErr(e?.message || 'Cannot load rooms');
    }
  }, [user]);

  React.useEffect(() => {
    if (user) reload(); // Tất cả user đều có thể xem danh sách
  }, [user, reload]);

  async function onDelete(roomName: string) {
    if (!user || !user.id || !user.name) return;
    
    // Xác nhận trước khi xóa
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng "${roomName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    
    setBusy(roomName);
    try {
      await deleteStudyRoom(roomName, { id: user.id, name: user.name, role: (user as any).role });
      await reload();
    } catch (e: any) {
      alert(e?.message || 'Không thể xóa phòng');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Tạo phòng học</h1>
      <CreateStudyRoom onCreated={reload} />

      <div className="pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Phòng đã tạo</h2>
          <button onClick={reload} className="text-sm px-3 py-1 rounded border">Làm mới</button>
        </div>
        {err ? <p className="text-red-600 text-sm mt-2">{err}</p> : null}
        <div className="mt-3 space-y-2">
          {rooms.length === 0 ? <p className="text-sm text-gray-500">Chưa có phòng nào.</p> : null}
          {rooms.map((r) => (
            <div key={r.roomName} className="flex items-center justify-between border rounded p-3">
              <div className="space-y-0.5">
                <div className="font-medium">{r.roomName}</div>
                <div className="text-xs text-gray-500">Người đang online: {r.numParticipants}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link className="px-3 py-1 rounded bg-black text-white text-sm hover:bg-gray-800 transition-colors" href={`${prefix}/study/${r.roomName}`}>Mở</Link>
                {canDelete ? (
                  <button 
                    disabled={busy === r.roomName} 
                    onClick={() => onDelete(r.roomName)} 
                    className="px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    title="Xóa phòng (chỉ admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {busy === r.roomName ? 'Đang xoá…' : 'Xoá'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



'use client';
import React from 'react';
import { CreateStudyRoom } from '@/components/CreateStudyRoom';
import { listStudyRooms, deleteStudyRoom } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CreateStudyRoomPage() {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = React.useState<Array<{ roomName: string; numParticipants: number; createdAt: string }>>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const p = useParams<{ locale?: string }>();
  const prefix = p?.locale ? `/${p.locale}` : '';

  const canManage = (user as any)?.role === 'admin' || (user as any)?.role === 'teacher';

  const reload = React.useCallback(async () => {
    if (!user) return;
    try {
      setErr(null);
      const data = await listStudyRooms({ id: user.id, name: user.name, role: (user as any).role });
      setRooms(data.rooms || []);
    } catch (e: any) {
      setErr(e?.message || 'Cannot load rooms');
    }
  }, [user]);

  React.useEffect(() => {
    if (user && canManage) reload();
  }, [user, canManage, reload]);

  async function onDelete(roomName: string) {
    if (!user) return;
    setBusy(roomName);
    try {
      await deleteStudyRoom(roomName, { id: user.id, name: user.name, role: (user as any).role });
      await reload();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!canManage) return <div className="p-6 text-gray-600">Chỉ admin/teacher.</div>;

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
                <Link className="px-3 py-1 rounded bg-black text-white text-sm" href={`${prefix}/study/${r.roomName}`}>Mở</Link>
                {(user as any)?.role === 'admin' ? (
                  <button disabled={busy === r.roomName} onClick={() => onDelete(r.roomName)} className="px-3 py-1 rounded border text-sm disabled:opacity-50">
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



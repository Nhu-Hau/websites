// components/study/CreateStudyRoom.tsx – cho teacher/admin
'use client';
import React, { useState } from 'react';
import { createRoom } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface CreateStudyRoomProps {
  onCreated?: () => void;
}

export function CreateStudyRoom({ onCreated }: CreateStudyRoomProps = {}) {
  const [room, setRoom] = useState('toeic-room-1');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const { user: authUser, loading: authLoading } = useAuth();
  // Tất cả user đều có thể tạo phòng

  async function onCreate() {
    setLoading(true);
    try {
      const u = { id: authUser?.id || `guest-${crypto.randomUUID()}`, name: authUser?.name || 'Guest', role: (authUser?.role as string) || 'teacher' };
      await createRoom(room, u);
      onCreated?.(); // Trigger reload if callback provided
      const localePrefix = params?.locale ? `/${params.locale}` : '';
      router.push(`${localePrefix}/study/${room}`);
    } catch (e) {
      console.error('Create room error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Không thể tạo phòng';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input value={room} onChange={(e) => setRoom(e.target.value)} className="border p-2 rounded w-full" placeholder="room-name" />
      <button onClick={onCreate} disabled={loading || authLoading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
        {loading ? 'Creating…' : 'Create & Open Room'}
      </button>
    </div>
  );
}


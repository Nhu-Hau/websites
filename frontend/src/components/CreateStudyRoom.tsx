// components/CreateStudyRoom.tsx – cho teacher/admin
'use client';
import React, { useState } from 'react';
import { createRoom } from '@/lib/api';
import { useRouter } from 'next/navigation';


export function CreateStudyRoom() {
const [room, setRoom] = useState('toeic-room-1');
const [loading, setLoading] = useState(false);
const router = useRouter();


async function onCreate() {
setLoading(true);
try {
const user = { id: 't001', name: 'Teacher A', role: 'teacher' };
await createRoom(room, user);
router.push(`/study/${room}`);
} finally {
setLoading(false);
}
}


return (
<div className="space-y-2">
<input value={room} onChange={(e) => setRoom(e.target.value)} className="border p-2 rounded w-full" placeholder="room-name" />
<button onClick={onCreate} disabled={loading} className="px-4 py-2 rounded bg-black text-white">
{loading ? 'Creating…' : 'Create & Open Room'}
</button>
</div>
);
}
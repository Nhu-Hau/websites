// app/study/[room]/page.tsx (Next 13+ App Router) – Client Component
'use client';
import React from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { getJoinToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';


export default function StudyRoomPage({ params }: { params: { room: string } }) {
const [token, setToken] = React.useState<string | null>(null);
const [wsUrl, setWsUrl] = React.useState<string>('');
const roomName = params.room;
const { user } = useAuth();


React.useEffect(() => {
const u = {
  id: user?.id || `guest-${crypto.randomUUID()}`,
  name: user?.name || 'Guest',
  role: (user?.role as any) || 'student',
};
getJoinToken(roomName, u).then((d) => {
setToken(d.token);
setWsUrl(d.wsUrl);
}).catch(console.error);
}, [roomName, user?.id, user?.name, user?.role]);


if (!token || !wsUrl) return <div>Loading room…</div>;


return (
<LiveKitRoom
token={token}
serverUrl={wsUrl}
connect
video
audio
// tối ưu băng thông
options={{
adaptiveStream: true,
dynacast: true,
}}
>
<VideoConference />
</LiveKitRoom>
);
}
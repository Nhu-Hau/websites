// app/study/[room]/page.tsx (Next 13+ App Router) – Client Component
'use client';
import React from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { getJoinToken } from '@/lib/api';


export default function StudyRoomPage({ params }: { params: { room: string } }) {
const [token, setToken] = React.useState<string | null>(null);
const [wsUrl, setWsUrl] = React.useState<string>('');
const roomName = params.room;


React.useEffect(() => {
const user = { id: 'u123', name: 'Sang', role: 'student' }; // Lấy từ auth thực tế
getJoinToken(roomName, user).then((d) => {
setToken(d.token);
setWsUrl(d.wsUrl);
}).catch(console.error);
}, [roomName]);


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
/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/lib/api.ts
export async function apiGet<T>(path: string) {
  const r = await fetch(path, { credentials: "include", cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}
export async function apiPost<T>(path: string, body?: any) {
  const r = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export function apiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:4000";
  return raw.replace(/\/$/, "");
}

// lib/api.ts (FE)
export async function createRoom(roomName: string, user: {id: string; name: string; role: string}) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
  const res = await fetch(`${base}/api/rooms`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': user.name,
      'x-user-role': user.role,
    },
    body: JSON.stringify({ roomName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create room');
  }
  return res.json();
}
  
  
  export async function getJoinToken(roomName: string, user: {id: string; name: string; role: string}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rooms/${roomName}/token`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'x-user-id': user.id,
  'x-user-name': user.name,
  'x-user-role': user.role,
  },
  });
  if (!res.ok) throw new Error('Cannot get token');
  return res.json();
  }

export async function listStudyRooms(user: { id: string; name: string; role: string }) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
  const res = await fetch(`${base}/api/study-rooms`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': user.name,
      'x-user-role': user.role,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteStudyRoom(roomName: string, user: { id: string; name: string; role: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/study-rooms/${encodeURIComponent(roomName)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': user.name,
      'x-user-role': user.role,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
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

// Helper function to encode name for headers (browser-safe)
function encodeNameForHeader(name: string): string {
  // Always use browser API - this code only runs in browser/client
  try {
    return btoa(unescape(encodeURIComponent(name)));
  } catch (e) {
    // Fallback: if encoding fails, use a safe ASCII representation
    console.warn('Failed to encode name, using fallback:', e);
    return btoa(name || 'Guest');
  }
}

// lib/api.ts (FE)
export async function createRoom(roomName: string, user: {id: string; name: string; role: string}): Promise<{ ok: boolean; room: any; reused: boolean }> {
  const base = apiBase();
  const url = `${base}/api/rooms`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName }),
    });
    
    if (!res.ok) {
      let errorMessage = `Failed to create room: ${res.status} ${res.statusText}`;
      let errorCode = '';
      
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
        errorCode = errorData.code || '';
      } catch {
        const text = await res.text().catch(() => '');
        if (text) errorMessage = text;
      }
      
      const error = new Error(errorMessage);
      (error as any).code = errorCode;
      (error as any).status = res.status;
      throw error;
    }
    
    return res.json();
  } catch (error: any) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Network error: Cannot connect to ${url}. Please check if the server is running and CORS is configured correctly.`);
    }
    throw error;
  }
}
  
  
  export async function getJoinToken(roomName: string, user: {id: string; name: string; role: string}) {
  const encodedName = encodeNameForHeader(user.name);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rooms/${roomName}/token`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'x-user-id': user.id,
  'x-user-name': encodedName,
  'x-user-name-encoded': 'base64',
  'x-user-role': user.role,
  },
  });
  if (!res.ok) throw new Error('Cannot get token');
  return res.json();
  }

export async function listStudyRooms(user: { id: string; name: string; role: string }) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
  const encodedName = encodeNameForHeader(user.name);
  const res = await fetch(`${base}/api/study-rooms`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': encodedName,
      'x-user-name-encoded': 'base64',
      'x-user-role': user.role,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteStudyRoom(roomName: string, user: { id: string; name: string; role: string }) {
  const encodedName = encodeNameForHeader(user.name);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/study-rooms/${encodeURIComponent(roomName)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': encodedName,
      'x-user-name-encoded': 'base64',
      'x-user-role': user.role,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
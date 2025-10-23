/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/lib/http.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';

function resolveUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) pathOrUrl = '/' + pathOrUrl;
  return API_BASE + pathOrUrl;
}

async function parseMaybeJson(res: Response) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

export async function getJson<T = any>(pathOrUrl: string, init?: RequestInit) {
  const res = await fetch(resolveUrl(pathOrUrl), {
    method: 'GET',
    credentials: 'include', // nếu dùng cookie httpOnly
    ...init,
  });
  const json = (await parseMaybeJson(res)) as T & { message?: string };
  if (!res.ok) throw new Error(json?.message || `GET ${res.status} ${res.statusText}`);
  return json;
}

export async function postJson<T = any>(pathOrUrl: string, data?: any, init?: RequestInit) {
  const res = await fetch(resolveUrl(pathOrUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include', // nếu dùng cookie httpOnly
    body: data != null ? JSON.stringify(data) : undefined,
    ...init,
  });
  const json = (await parseMaybeJson(res)) as T & { message?: string };
  if (!res.ok) throw new Error(json?.message || `POST ${res.status} ${res.statusText}`);
  return json;
}

export async function delJson<T = any>(pathOrUrl: string, init?: RequestInit) {
  const res = await fetch(resolveUrl(pathOrUrl), {
    method: 'DELETE',
    credentials: 'include',
    ...init,
  });
  const json = (await parseMaybeJson(res)) as T & { message?: string };
  if (!res.ok) throw new Error(json?.message || `DELETE ${res.status} ${res.statusText}`);
  return json;
}

/** Demo headers để test nhanh auth qua x-user-* (dev) */
export function demoUserHeaders(u: { id: string; name?: string; role?: 'admin'|'teacher'|'student' }) {
  return {
    'x-user-id': u.id,
    'x-user-name': u.name ?? 'Guest',
    'x-user-role': u.role ?? 'student',
  };
}

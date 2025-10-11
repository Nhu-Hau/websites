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

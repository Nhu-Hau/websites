/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/http.ts
export async function postJson<T = any>(url: string, data: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // cần nếu bạn dùng cookie httpOnly
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json } as { ok: boolean; json: T & { message?: string } };
}

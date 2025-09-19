/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '');

export async function fetchItemsByPart(part: string, limit = 6) {
  const url = `${API_BASE}/api/items/by-part?part=${encodeURIComponent(part)}&limit=${limit}&shuffle=0`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch items failed');
  return res.json() as Promise<{ items: any[]; stimulusMap: Record<string, any> }>;
}

export async function submitAttempt(payload: {
  userId: string; testId: string; startedAt?: string;
  answers: { itemId: string; choice: 'A'|'B'|'C'|'D'; timeSec?: number }[];
}) {
  const res = await fetch(`${API_BASE}/api/attempts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Submit failed'); }
  return res.json();
}

export async function fetchItemsByIdsWithAnswer(ids: string[]) {
  const url = `${API_BASE}/api/items?ids=${encodeURIComponent(ids.join(','))}&reveal=1`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch items by ids failed');
  return res.json() as Promise<{ items: any[] }>;
}
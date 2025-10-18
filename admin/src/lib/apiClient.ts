/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '');

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'user'|'admin';
  access: 'free'|'premium';
  level: 1|2|3;
  createdAt?: string;
  updatedAt?: string;
};

export async function adminListUsers(params?: { page?: number; limit?: number; q?: string; role?: string; access?: string; }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.q) usp.set('q', params.q);
  if (params?.role) usp.set('role', params.role);
  if (params?.access) usp.set('access', params.access);
  const res = await fetch(`${API_BASE}/api/admin/users?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch users failed'); }
  return res.json() as Promise<{ items: AdminUser[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminUpdateUser(id: string, body: Partial<Pick<AdminUser,'name'|'role'|'access'>> & { level?: 1|2|3 }) {
  const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Update user failed'); }
  return res.json() as Promise<{ user: AdminUser }>;
}

export async function adminDeleteUser(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete user failed'); }
  return res.json() as Promise<{ message: string }>;
}

export async function adminOverview() {
  const res = await fetch(`${API_BASE}/api/admin/analytics/overview`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch overview failed'); }
  return res.json() as Promise<{ totalUsers: number; avgOverall: number; byLevel: Record<'1'|'2'|'3', number> | Record<number, number>; histogram: { min: number; max: number; count: number }[] }>;
}

export async function adminUserScores() {
  const res = await fetch(`${API_BASE}/api/admin/analytics/user-scores`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch user scores failed'); }
  return res.json() as Promise<{ users: Array<{ _id: string; name: string; email: string; level: number; overall: number; listening: number; reading: number; submittedAt: string }> }>;
}



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

export type AdminCommunityPost = {
  _id: string;
  userId: any;
  user: any;
  content: string;
  tags: string[];
  attachments: Array<{ type: string; url: string; name?: string; size?: number; key?: string }>;
  likedBy: any[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommunityComment = {
  _id: string;
  postId: any;
  userId: any;
  user: any;
  content: string;
  attachments: Array<{ type: string; url: string; name?: string; size?: number; key?: string }>;
  createdAt: string;
  updatedAt: string;
};

export async function adminListCommunityPosts(params?: { page?: number; limit?: number; q?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.q) usp.set('q', params.q);
  const res = await fetch(`${API_BASE}/api/admin/community/posts?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch posts failed'); }
  return res.json() as Promise<{ items: AdminCommunityPost[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminCreateCommunityPost(params: { content: string; userId: string }) {
  const res = await fetch(`${API_BASE}/api/admin/community/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create post failed'); }
  return res.json() as Promise<AdminCommunityPost>;
}

export async function adminDeleteCommunityPost(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/community/posts/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete post failed'); }
  return res.json() as Promise<{ message: string }>;
}

export async function adminListCommunityComments(params?: { page?: number; limit?: number; q?: string; postId?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.q) usp.set('q', params.q);
  if (params?.postId) usp.set('postId', params.postId);
  const res = await fetch(`${API_BASE}/api/admin/community/comments?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch comments failed'); }
  return res.json() as Promise<{ items: AdminCommunityComment[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminDeleteCommunityComment(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/community/comments/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete comment failed'); }
  return res.json() as Promise<{ message: string }>;
}



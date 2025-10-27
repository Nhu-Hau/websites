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

// Parts management
export type AdminPart = {
  id: string;
  part: string;
  level: number;
  test?: number | null;
  order?: number;
  answer: string;
  tags?: string[];
  question?: string;
  stem?: string;
  options?: Record<string, any>;
  stimulusId?: string | null;
  _id?: string;
};

export type AdminPartsStats = {
  total: number;
  byPart: Array<{ _id: string; count: number }>;
  byLevel: Array<{ _id: number; count: number }>;
  byTest: Array<{ _id: { part: string; test: number }; count: number }>;
};

export async function adminListParts(params?: { page?: number; limit?: number; part?: string; level?: number; test?: number; q?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.part) usp.set('part', params.part);
  if (params?.level) usp.set('level', String(params.level));
  if (params?.test) usp.set('test', String(params.test));
  if (params?.q) usp.set('q', params.q);
  const res = await fetch(`${API_BASE}/api/admin/parts?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch parts failed'); }
  return res.json() as Promise<{ items: AdminPart[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminGetPart(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/parts/${encodeURIComponent(id)}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch part failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminGetPartsStats() {
  const res = await fetch(`${API_BASE}/api/admin/parts/stats`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch parts stats failed'); }
  return res.json() as Promise<AdminPartsStats>;
}

export async function adminCreatePart(body: Partial<AdminPart>) {
  const res = await fetch(`${API_BASE}/api/admin/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create part failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminUpdatePart(id: string, body: Partial<AdminPart>) {
  const res = await fetch(`${API_BASE}/api/admin/parts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Update part failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminDeletePart(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/parts/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete part failed'); }
  return res.json() as Promise<{ message: string }>;
}

export type AdminTest = {
  part: string;
  level: number;
  test: number;
  itemCount: number;
  firstItemId: string;
};

export async function adminListTests(params?: { part?: string; level?: number }) {
  const usp = new URLSearchParams();
  if (params?.part) usp.set('part', params.part);
  if (params?.level) usp.set('level', String(params.level));
  const res = await fetch(`${API_BASE}/api/admin/parts/tests?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch tests failed'); }
  return res.json() as Promise<{ tests: AdminTest[] }>;
}

export async function adminGetTestItems(params: { part: string; level: number; test: number }) {
  const usp = new URLSearchParams();
  usp.set('part', params.part);
  usp.set('level', String(params.level));
  usp.set('test', String(params.test));
  const res = await fetch(`${API_BASE}/api/admin/parts/test/items?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch test items failed'); }
  return res.json() as Promise<{ items: AdminPart[]; stimulusMap: Record<string, AdminStimulus> }>;
}

export async function adminDeleteTest(params: { part: string; level: number; test: number }) {
  const usp = new URLSearchParams();
  usp.set('part', params.part);
  usp.set('level', String(params.level));
  usp.set('test', String(params.test));
  const res = await fetch(`${API_BASE}/api/admin/parts/test?${usp.toString()}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete test failed'); }
  return res.json() as Promise<{ message: string; deletedCount: number }>;
}

export type AdminStimulus = {
  id: string;
  part: string;
  level: number;
  test: number;
  media: {
    image: string | null;
    audio: string;
    script: string;
    explain: string;
  };
};

export async function adminCreateTest(body: { part: string; level: number; test: number; items: AdminPart[]; stimuli?: AdminStimulus[] }) {
  const res = await fetch(`${API_BASE}/api/admin/parts/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create test failed'); }
  return res.json() as Promise<{ message: string; count: number }>;
}

export async function adminCreateOrUpdateItem(body: AdminPart) {
  const res = await fetch(`${API_BASE}/api/admin/parts/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create/update item failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminUploadStimulusMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/admin/parts/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!res.ok) { 
    const e = await res.json().catch(() => ({})); 
    throw new Error(e.message || 'Upload failed'); 
  }
  
  return res.json() as Promise<{ url: string; key: string; type: string; name: string; size: number }>;
}

export async function adminCreateStimulus(body: { id: string; part: string; level: number; test: number; media: any }) {
  const res = await fetch(`${API_BASE}/api/admin/parts/stimulus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create stimulus failed'); }
  return res.json() as Promise<{ stimulus: AdminStimulus }>;
}

export async function adminUpdateStimulus(id: string, media: any) {
  const res = await fetch(`${API_BASE}/api/admin/parts/stimulus/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ media }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Update stimulus failed'); }
  return res.json() as Promise<{ stimulus: AdminStimulus }>;
}

export async function adminDeleteStimulus(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/parts/stimulus/${encodeURIComponent(id)}`, { 
    method: 'DELETE',
    credentials: 'include' 
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete stimulus failed'); }
  return res.json() as Promise<{ message: string }>;
}




/* eslint-disable @typescript-eslint/no-explicit-any */
// Use relative paths to leverage Next.js rewrites for cookie forwarding
const API_BASE = '';

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'user'|'teacher'|'admin';
  access: 'free'|'premium';
  level: 1|2|3;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminPromoCode = {
  _id: string;
  code: string;
  type?: "fixed" | "percent" | null;
  value?: number | null;
  amountAfter?: number | null;
  baseAmount?: number | null;
  activeFrom?: string | null;
  activeTo?: string | null;
  maxUses?: number | null;
  usedCount: number;
  perUserLimit?: number | null;
  allowedUsers?: string[];
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
  const res = await fetch(`/api/admin/users?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch users failed'); }
  return res.json() as Promise<{ items: AdminUser[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminUpdateUser(id: string, body: Partial<Pick<AdminUser,'name'|'role'|'access'>> & { level?: 1|2|3 }) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Update user failed'); }
  return res.json() as Promise<{ user: AdminUser }>;
}

export async function adminListPromoCodes(params?: { page?: number; limit?: number; q?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set("page", String(params.page));
  if (params?.limit) usp.set("limit", String(params.limit));
  if (params?.q) usp.set("q", params.q);
  const res = await fetch(`/api/admin/promos?${usp.toString()}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Fetch promo codes failed");
  }
  return res.json() as Promise<{ items: AdminPromoCode[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminCreatePromoCode(body: Partial<AdminPromoCode> & { code: string }) {
  const res = await fetch(`/api/admin/promos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Create promo code failed");
  }
  return res.json() as Promise<AdminPromoCode>;
}

export async function adminUpdatePromoCode(code: string, body: Partial<AdminPromoCode>) {
  const res = await fetch(`/api/admin/promos/${encodeURIComponent(code)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Update promo code failed");
  }
  return res.json() as Promise<AdminPromoCode>;
}

export async function adminDeletePromoCode(code: string) {
  const res = await fetch(`/api/admin/promos/${encodeURIComponent(code)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Delete promo code failed");
  }
  return res.json() as Promise<{ message: string }>;
}

export async function adminDeleteUser(id: string) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete user failed'); }
  return res.json() as Promise<{ message: string }>;
}

export async function adminOverview() {
  const res = await fetch(`/api/admin/analytics/overview`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch overview failed'); }
  return res.json() as Promise<{ totalUsers: number; avgOverall: number; byLevel: Record<'1'|'2'|'3', number> | Record<number, number>; histogram: { min: number; max: number; count: number }[] }>;
}

export async function adminVisitorCount() {
  const res = await fetch(`/api/admin/analytics/visitor-count`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch visitor count failed'); }
  return res.json() as Promise<{ totalVisits: number; uniqueVisitorsLast30Days: number }>;
}

export async function adminOnlineUsersCount() {
  const res = await fetch(`/api/admin/analytics/online-users`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch online users count failed'); }
  return res.json() as Promise<{ onlineUsers: number; activeUsers: number }>;
}

export async function adminVpsStats() {
  const res = await fetch(`/api/admin/analytics/vps-stats`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch VPS stats failed'); }
  return res.json() as Promise<{ cpu: number; realMemory: number; virtualMemory: number; localDiskSpace: number; os: string; uptime: string; uptimeSeconds: number }>;
}

export async function adminVpsRestart() {
  const res = await fetch(`/api/admin/vps/restart`, { 
    method: 'POST',
    credentials: 'include', 
    cache: 'no-store' 
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Restart VPS failed'); }
  return res.json() as Promise<{ message: string }>;
}

export async function adminPm2Logs(app: 'admin' | 'frontend' | 'api', lines?: number) {
  const usp = new URLSearchParams();
  if (lines) usp.set('lines', String(lines));
  const res = await fetch(`/api/admin/vps/pm2-logs/${app}?${usp.toString()}`, { 
    credentials: 'include', 
    cache: 'no-store' 
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch PM2 logs failed'); }
  return res.json() as Promise<{ logs: string; app: string; lines: number }>;
}

export async function adminUserScores() {
  const res = await fetch(`/api/admin/analytics/user-scores`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch user scores failed'); }
  return res.json() as Promise<{ users: Array<{ _id: string; name: string; email: string; level: number; overall: number; listening: number; reading: number; submittedAt: string }> }>;
}

export async function adminUserToeicPred() {
  const res = await fetch(`/api/admin/analytics/user-toeic-pred`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch user TOEIC predictions failed'); }
  return res.json() as Promise<{ users: Array<{ _id: string; name: string; email: string; level: number; toeicPred: { overall: number | null; listening: number | null; reading: number | null } }> }>;
}

export type AdminPlacementAttempt = {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  total: number;
  correct: number;
  acc: number;
  listening: { total: number; correct: number; acc: number; score: number };
  reading: { total: number; correct: number; acc: number; score: number };
  level: number;
  predicted: any;
  overall: number;
  submittedAt: string;
};

export type AdminProgressAttempt = {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  total: number;
  correct: number;
  acc: number;
  listening: { total: number; correct: number; acc: number; score: number };
  reading: { total: number; correct: number; acc: number; score: number };
  level: number;
  predicted: any;
  overall: number;
  submittedAt: string;
};

export type AdminPracticeAttempt = {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  partKey: string;
  level: number;
  test: number;
  total: number;
  correct: number;
  acc: number;
  timeSec: number;
  submittedAt: string;
  isRetake: boolean;
};

export async function adminListPlacementAttempts(params?: { page?: number; limit?: number; userId?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.userId) usp.set('userId', params.userId);
  const res = await fetch(`/api/admin/attempts/placement?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch placement attempts failed'); }
  return res.json() as Promise<{ items: AdminPlacementAttempt[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminListProgressAttempts(params?: { page?: number; limit?: number; userId?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.userId) usp.set('userId', params.userId);
  const res = await fetch(`/api/admin/attempts/progress?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch progress attempts failed'); }
  return res.json() as Promise<{ items: AdminProgressAttempt[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminListPracticeAttempts(params?: { page?: number; limit?: number; userId?: string; partKey?: string; level?: number }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.userId) usp.set('userId', params.userId);
  if (params?.partKey) usp.set('partKey', params.partKey);
  if (params?.level) usp.set('level', String(params.level));
  const res = await fetch(`/api/admin/attempts/practice?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch practice attempts failed'); }
  return res.json() as Promise<{ items: AdminPracticeAttempt[]; total: number; page: number; limit: number; pages: number }>;
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
  reportsCount: number;
  isHidden: boolean;
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
  const res = await fetch(`/api/admin/community/posts?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch posts failed'); }
  return res.json() as Promise<{ items: AdminCommunityPost[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminCreateCommunityPost(params: { content: string; userId: string; attachments?: Array<{ type: string; url: string; name?: string; size?: number; key?: string }> }) {
  const res = await fetch(`/api/admin/community/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create post failed'); }
  return res.json() as Promise<AdminCommunityPost>;
}

export async function adminDeleteCommunityPost(id: string) {
  const res = await fetch(`/api/admin/community/posts/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete post failed'); }
  return res.json() as Promise<{ message: string }>;
}

export async function adminToggleCommunityPostVisibility(id: string, isHidden: boolean) {
  const res = await fetch(`/api/admin/community/posts/${encodeURIComponent(id)}/hide`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isHidden }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Toggle post visibility failed'); }
  return res.json() as Promise<{ item: AdminCommunityPost }>;
}

export async function adminListCommunityComments(params?: { page?: number; limit?: number; q?: string; postId?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set('page', String(params.page));
  if (params?.limit) usp.set('limit', String(params.limit));
  if (params?.q) usp.set('q', params.q);
  if (params?.postId) usp.set('postId', params.postId);
  const res = await fetch(`/api/admin/community/comments?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch comments failed'); }
  return res.json() as Promise<{ items: AdminCommunityComment[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminDeleteCommunityComment(id: string) {
  const res = await fetch(`/api/admin/community/comments/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete comment failed'); }
  return res.json() as Promise<{ message: string }>;
}

// Study room management
export type AdminStudyRoom = {
  roomName: string;
  createdBy?: { id?: string; name?: string; role?: string };
  currentHostId?: string;
  currentHost?: { id?: string; name?: string; role?: string };
  createdAt?: string;
  lastActivityAt?: string;
  numParticipants: number;
  documentsCount: number;
  totalDocumentSize: number;
  commentsCount: number;
  bannedCount: number;
};

export type AdminRoomComment = {
  _id: string;
  roomName: string;
  userId: string;
  userName: string;
  userRole: string;
  userAccess: "free" | "premium";
  content: string;
  createdAt: string;
};

export type AdminRoomDocument = {
  _id: string;
  roomName: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: { id?: string; name?: string; role?: string };
};

export async function adminListStudyRooms(params?: { page?: number; limit?: number; q?: string }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set("page", String(params.page));
  if (params?.limit) usp.set("limit", String(params.limit));
  if (params?.q) usp.set("q", params.q);
  const res = await fetch(`/api/admin/study-rooms?${usp.toString()}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Fetch study rooms failed");
  }
  return res.json() as Promise<{ items: AdminStudyRoom[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminDeleteStudyRoom(roomName: string) {
  const res = await fetch(`/api/admin/study-rooms/${encodeURIComponent(roomName)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Delete study room failed");
  }
  return res.json() as Promise<{ message: string }>;
}

export async function adminListRoomComments(roomName: string, params?: { page?: number; limit?: number }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set("page", String(params.page));
  if (params?.limit) usp.set("limit", String(params.limit));
  const res = await fetch(`/api/admin/study-rooms/${encodeURIComponent(roomName)}/comments?${usp.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Fetch room comments failed");
  }
  return res.json() as Promise<{ items: AdminRoomComment[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminDeleteRoomComment(roomName: string, commentId: string) {
  const res = await fetch(
    `/api/admin/study-rooms/${encodeURIComponent(roomName)}/comments/${encodeURIComponent(commentId)}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Delete room comment failed");
  }
  return res.json() as Promise<{ message: string }>;
}

export async function adminListRoomDocuments(roomName: string, params?: { page?: number; limit?: number }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set("page", String(params.page));
  if (params?.limit) usp.set("limit", String(params.limit));
  const res = await fetch(`/api/admin/study-rooms/${encodeURIComponent(roomName)}/documents?${usp.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Fetch room documents failed");
  }
  return res.json() as Promise<{ items: AdminRoomDocument[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminDeleteRoomDocument(roomName: string, docId: string) {
  const res = await fetch(
    `/api/admin/study-rooms/${encodeURIComponent(roomName)}/documents/${encodeURIComponent(docId)}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Delete room document failed");
  }
  return res.json() as Promise<{ message: string }>;
}

// News management
export type AdminNewsItem = {
  _id: string;
  title: string;
  category: string;
  image: string;
  paragraphs: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  viewCount: number;
};

export async function adminListNews(params?: { page?: number; limit?: number; q?: string; category?: string; status?: "draft" | "published" }) {
  const usp = new URLSearchParams();
  if (params?.page) usp.set("page", String(params.page));
  if (params?.limit) usp.set("limit", String(params.limit));
  if (params?.q) usp.set("q", params.q);
  if (params?.category) usp.set("category", params.category);
  if (params?.status) usp.set("status", params.status);
  const res = await fetch(`/api/admin/news?${usp.toString()}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Fetch news failed");
  }
  return res.json() as Promise<{ items: AdminNewsItem[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminCreateNews(body: {
  title: string;
  category: string;
  image: string;
  paragraphs: string[];
  publishedAt?: string;
  isPublished?: boolean;
}) {
  const res = await fetch(`/api/admin/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Create news failed");
  }
  return res.json() as Promise<{ data: AdminNewsItem }>;
}

export async function adminUpdateNews(
  id: string,
  body: Partial<{
    title: string;
    category: string;
    image: string;
    paragraphs: string[];
    publishedAt: string;
    isPublished: boolean;
  }>
) {
  const res = await fetch(`/api/admin/news/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Update news failed");
  }
  return res.json() as Promise<{ data: AdminNewsItem }>;
}

export async function adminDeleteNews(id: string) {
  const res = await fetch(`/api/admin/news/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || "Delete news failed");
  }
  return res.json() as Promise<{ message: string }>;
}

// Admin chat management
export async function adminDeleteChatMessage(id: string) {
  const res = await fetch(`/api/admin-chat/admin/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Delete message failed');
  }
  return res.json() as Promise<{ message: string }>;
}

export async function adminDeleteChatConversation(sessionId: string) {
  const res = await fetch(`/api/admin-chat/admin/conversations/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Delete conversation failed');
  }
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
  const res = await fetch(`/api/admin/parts?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch parts failed'); }
  return res.json() as Promise<{ items: AdminPart[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminGetPart(id: string) {
  const res = await fetch(`/api/admin/parts/${encodeURIComponent(id)}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch part failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminGetPartsStats() {
  const res = await fetch(`/api/admin/parts/stats`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch parts stats failed'); }
  return res.json() as Promise<AdminPartsStats>;
}

export async function adminCreatePart(body: Partial<AdminPart>) {
  const res = await fetch(`/api/admin/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create part failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminUpdatePart(id: string, body: Partial<AdminPart>) {
  const res = await fetch(`/api/admin/parts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Update part failed'); }
  return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminDeletePart(id: string) {
  const res = await fetch(`/api/admin/parts/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
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
  const res = await fetch(`/api/admin/parts/tests?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch tests failed'); }
  return res.json() as Promise<{ tests: AdminTest[] }>;
}

export async function adminGetTestItems(params: { part: string; level: number; test: number }) {
  const usp = new URLSearchParams();
  usp.set('part', params.part);
  usp.set('level', String(params.level));
  usp.set('test', String(params.test));
  const res = await fetch(`/api/admin/parts/test/items?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Fetch test items failed'); }
  return res.json() as Promise<{ items: AdminPart[]; stimulusMap: Record<string, AdminStimulus> }>;
}

export async function adminDeleteTest(params: { part: string; level: number; test: number }) {
  const usp = new URLSearchParams();
  usp.set('part', params.part);
  usp.set('level', String(params.level));
  usp.set('test', String(params.test));
  const res = await fetch(`/api/admin/parts/test?${usp.toString()}`, { method: 'DELETE', credentials: 'include' });
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
  const res = await fetch(`/api/admin/parts/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create test failed'); }
  return res.json() as Promise<{ message: string; count: number }>;
}

export async function adminCreateOrUpdateItem(body: AdminPart) {
  const res = await fetch(`/api/admin/parts/item`, {
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
  
  const res = await fetch(`/api/admin/parts/upload`, {
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
  const res = await fetch(`/api/admin/parts/stimulus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Create stimulus failed'); }
  return res.json() as Promise<{ stimulus: AdminStimulus }>;
}

export async function adminUpdateStimulus(id: string, media: any) {
  const res = await fetch(`/api/admin/parts/stimulus/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ media }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Update stimulus failed'); }
  return res.json() as Promise<{ stimulus: AdminStimulus }>;
}

export async function adminDeleteStimulus(id: string) {
  const res = await fetch(`/api/admin/parts/stimulus/${encodeURIComponent(id)}`, { 
    method: 'DELETE',
    credentials: 'include' 
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Delete stimulus failed'); }
  return res.json() as Promise<{ message: string }>;
}




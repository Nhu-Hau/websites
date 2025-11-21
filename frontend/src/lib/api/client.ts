/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/lib/api/client.ts
// Unified API client combining api.ts, http.ts, and fetchWithAuth.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';

function resolveUrl(pathOrUrl: string) {
  // Nếu là absolute URL, trả về nguyên vẹn
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  
  // Nếu path bắt đầu với /api/ và đang chạy trong browser, 
  // giữ nguyên để đi qua Next.js rewrite proxy (giống admin login)
  if (typeof window !== 'undefined' && pathOrUrl.startsWith('/api/')) {
    return pathOrUrl;
  }
  
  // Các trường hợp khác: prepend API_BASE
  if (!pathOrUrl.startsWith('/')) pathOrUrl = '/' + pathOrUrl;
  return API_BASE + pathOrUrl;
}

async function parseMaybeJson(res: Response) {
  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  
  // If no content or not JSON, return empty object for successful responses
  if (!isJson || res.status === 204) {
    return { _rawText: "" };
  }
  
  // Clone the response to read text without consuming the original
  // Note: We can't clone after reading, so we'll read it once and store
  const text = await res.text();
  
  // Store raw text for debugging
  const result: any = { _rawText: text };
  
  if (!text || text.trim() === "") {
    return result;
  }
  
  try {
    const parsed = JSON.parse(text);
    // Merge parsed data with raw text for debugging
    return { ...parsed, _rawText: text };
  } catch (e) {
    // If parsing fails but response is successful, return empty object
    // For error responses, return the raw text as message
    if (res.ok) {
      console.warn("Failed to parse JSON response, but status is OK:", text);
      return result;
    }
    // For error responses, try to extract message from text
    // Sometimes backend returns plain text or HTML error pages
    return { 
      raw: text, 
      message: text.substring(0, 200),
      _rawText: text,
      _parseError: String(e)
    };
  }
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

// ==================== Token Refresh Logic ====================
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh token một lần duy nhất (tránh nhiều request refresh đồng thời)
 */
async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return res.ok;
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.warn("[fetchWithAuth] Refresh token failed:", e);
      }
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch với tự động refresh token khi gặp 401
 */
export async function fetchWithAuth(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    // Lần gọi đầu tiên
    let response = await fetch(url, {
      ...init,
      credentials: "include",
    });

    // Nếu không phải 401, trả về ngay
    if (response.status !== 401) {
      return response;
    }

    // Gặp 401, thử refresh token
    const refreshSuccess = await attemptRefresh();

    if (!refreshSuccess) {
      // Refresh thất bại, trả về response 401 gốc
      return response;
    }

    // Refresh thành công, thử lại request gốc
    // Clone init để tránh mutate
    const retryInit = { ...init };
    // Xóa signal cũ nếu có (vì đã abort)
    if (retryInit.signal) {
      delete retryInit.signal;
    }

    response = await fetch(url, {
      ...retryInit,
      credentials: "include",
    });

    return response;
  } catch (error: any) {
    // Network errors or other fetch errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}

// ==================== Basic HTTP Methods ====================

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
  const json = (await parseMaybeJson(res)) as T & { message?: string; code?: string };
  if (!res.ok) {
    const error = new Error(json?.message || `POST ${res.status} ${res.statusText}`);
    (error as any).code = json?.code;
    (error as any).status = res.status;
    throw error;
  }
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

// ==================== Auth-enabled HTTP Methods ====================

/**
 * getJson với auto-refresh
 */
export async function getJsonWithAuth<T = any>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetchWithAuth(resolveUrl(pathOrUrl), {
    method: "GET",
    ...init,
  });

  const json = (await parseMaybeJson(res)) as T & { message?: string };
  if (!res.ok) {
    const error = new Error(
      json?.message || `GET ${res.status} ${res.statusText}`
    );
    (error as any).status = res.status;
    throw error;
  }
  return json;
}

/**
 * postJson với auto-refresh
 */
export async function postJsonWithAuth<T = any>(
  pathOrUrl: string,
  data?: any,
  init?: RequestInit
): Promise<T> {
  const res = await fetchWithAuth(resolveUrl(pathOrUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: data != null ? JSON.stringify(data) : undefined,
    ...init,
  });

  const json = (await parseMaybeJson(res)) as T & { message?: string; code?: string; raw?: string; _rawText?: string; _parseError?: string };
  if (!res.ok) {
    // Log the full response for debugging
    const contentType = res.headers.get("content-type");
    const rawText = json._rawText || "";
    
    console.error("[postJsonWithAuth] Request failed:", {
      url: pathOrUrl,
      fullUrl: resolveUrl(pathOrUrl),
      status: res.status,
      statusText: res.statusText,
      contentType: contentType,
      responseJson: json,
      rawText: rawText || "(empty)",
      rawTextLength: rawText.length,
      parseError: json._parseError,
      hasMessage: !!json?.message,
      message: json?.message,
      headers: Object.fromEntries(res.headers.entries()),
    });
    
    // Try to get error message from various possible fields
    // Priority: json.message > json.raw > _rawText (if it looks like JSON or error message) > default
    let errorMessage: string;
    
    if (json?.message) {
      errorMessage = json.message;
    } else if (typeof json?.raw === 'string' && json.raw.trim()) {
      errorMessage = json.raw;
    } else if (rawText && rawText.trim()) {
      // Try to parse rawText as JSON if it looks like JSON
      if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawText);
          errorMessage = parsed.message || rawText.substring(0, 200);
        } catch {
          errorMessage = rawText.substring(0, 200);
        }
      } else {
        errorMessage = rawText.substring(0, 200);
      }
    } else {
      errorMessage = `POST ${res.status} ${res.statusText}`;
    }
    
    const error = new Error(errorMessage);
    (error as any).code = json?.code;
    (error as any).status = res.status;
    (error as any).response = json; // Store full response for debugging
    (error as any).rawText = rawText; // Store raw text
    throw error;
  }
  
  // Remove internal debugging fields before returning
  const { _rawText, _parseError, ...cleanJson } = json as any;
  return cleanJson as T;
}

/**
 * putJson với auto-refresh
 */
export async function putJsonWithAuth<T = any>(
  pathOrUrl: string,
  data?: any,
  init?: RequestInit
): Promise<T> {
  const res = await fetchWithAuth(resolveUrl(pathOrUrl), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: data != null ? JSON.stringify(data) : undefined,
    ...init,
  });

  const json = (await parseMaybeJson(res)) as T & { message?: string; code?: string; raw?: string };
  if (!res.ok) {
    // Try to get error message from various possible fields
    const errorMessage = json?.message || 
                        (typeof json?.raw === 'string' ? json.raw : undefined) ||
                        `PUT ${res.status} ${res.statusText}`;
    const error = new Error(errorMessage);
    (error as any).code = json?.code;
    (error as any).status = res.status;
    (error as any).response = json; // Store full response for debugging
    throw error;
  }
  return json;
}

/**
 * deleteJson với auto-refresh
 */
export async function deleteJsonWithAuth<T = any>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetchWithAuth(resolveUrl(pathOrUrl), {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  const json = (await parseMaybeJson(res)) as T & { message?: string; code?: string; raw?: string };
  if (!res.ok) {
    // Try to get error message from various possible fields
    const errorMessage = json?.message || 
                        (typeof json?.raw === 'string' ? json.raw : undefined) ||
                        `DELETE ${res.status} ${res.statusText}`;
    const error = new Error(errorMessage);
    (error as any).code = json?.code;
    (error as any).status = res.status;
    (error as any).response = json; // Store full response for debugging
    throw error;
  }
  // For DELETE, return the parsed JSON if available, otherwise empty object
  // This handles cases where DELETE returns data (like deleteTerm) or just success message
  return json;
}

// ==================== Legacy API Methods (from api.ts) ====================

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

// ==================== Study Room Methods ====================

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
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
  const encodedName = encodeNameForHeader(user.name);
  const res = await fetch(`${base}/api/rooms/${encodeURIComponent(roomName)}`, {
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
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Failed to delete room: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ==================== Teacher Lead Methods ====================

export interface TeacherLeadPayload {
  fullName: string;
  email: string;
  phone: string;
  scoreOrCert?: string;
  experience?: string;
  availability?: string;
  message?: string;
}

export async function createTeacherLead(payload: TeacherLeadPayload) {
  return postJson("/api/teacher-leads", payload);
}

// ==================== Demo/Dev Helpers ====================

/** Demo headers để test nhanh auth qua x-user-* (dev) */
export function demoUserHeaders(u: { id: string; name?: string; role?: 'admin'|'teacher'|'student' }) {
  const name = u.name ?? 'Guest';
  const encodedName = encodeNameForHeader(name);
  return {
    'x-user-id': u.id,
    'x-user-name': encodedName,
    'x-user-name-encoded': 'base64',
    'x-user-role': u.role ?? 'student',
  };
}

// ==================== API Client Object ====================

/**
 * API Client object với interface giống axios
 * Wraps các hàm auth-enabled methods và trả về { data }
 */
export const apiClient = {
  async get<T = any>(pathOrUrl: string, init?: RequestInit): Promise<{ data: T }> {
    const data = await getJsonWithAuth<T>(pathOrUrl, init);
    return { data };
  },

  async post<T = any>(pathOrUrl: string, data?: any, init?: RequestInit): Promise<{ data: T }> {
    const result = await postJsonWithAuth<T>(pathOrUrl, data, init);
    return { data: result };
  },

  async put<T = any>(pathOrUrl: string, data?: any, init?: RequestInit): Promise<{ data: T }> {
    const result = await putJsonWithAuth<T>(pathOrUrl, data, init);
    return { data: result };
  },

  async delete<T = any>(pathOrUrl: string, init?: RequestInit): Promise<{ data: T }> {
    const result = await deleteJsonWithAuth<T>(pathOrUrl, init);
    return { data: result };
  },
};

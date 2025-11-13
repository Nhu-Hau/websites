/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/lib/fetchWithAuth.ts
// Wrapper cho fetch với tự động refresh token khi gặp 401

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
}

/**
 * getJson với auto-refresh
 */
export async function getJsonWithAuth<T = any>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:4000";

  function resolveUrl(path: string) {
    if (/^https?:\/\//i.test(path)) return path;
    if (!path.startsWith("/")) path = "/" + path;
    return API_BASE + path;
  }

  async function parseMaybeJson(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { raw: text };
    }
  }

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
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:4000";

  function resolveUrl(path: string) {
    if (/^https?:\/\//i.test(path)) return path;
    if (!path.startsWith("/")) path = "/" + path;
    return API_BASE + path;
  }

  async function parseMaybeJson(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { raw: text };
    }
  }

  const res = await fetchWithAuth(resolveUrl(pathOrUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: data != null ? JSON.stringify(data) : undefined,
    ...init,
  });

  const json = (await parseMaybeJson(res)) as T & { message?: string; code?: string };
  if (!res.ok) {
    const error = new Error(
      json?.message || `POST ${res.status} ${res.statusText}`
    );
    (error as any).code = json?.code;
    (error as any).status = res.status;
    throw error;
  }
  return json;
}




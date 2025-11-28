/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-side API client for React Server Components
 * This module provides functions to fetch data on the server side
 * without sending unnecessary JavaScript to the client.
 */

import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type FetchOptions = {
  cache?: RequestCache;
  revalidate?: number;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
};

async function serverFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    cache = "no-store",
    revalidate,
    credentials = "include",
    headers = {},
  } = options;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  // Get cookies from Next.js and forward them to the API
  const cookieStore = await cookies();
  const cookieEntries: string[] = [];
  cookieStore.getAll().forEach((cookie) => {
    cookieEntries.push(`${cookie.name}=${cookie.value}`);
  });
  const cookieHeader = cookieEntries.join("; ");

  const response = await fetch(url, {
    cache,
    next: revalidate ? { revalidate } : undefined,
    credentials,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch user profile
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getMe() {
  try {
    const data = await serverFetch<any>("/api/auth/me", {
      cache: "no-store",
    });
    // Normalize response format
    return data?.user || data?.data || data || null;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

/**
 * Fetch practice history
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getPracticeHistory(params?: {
  limit?: number;
  page?: number;
  partKey?: string;
  level?: string;
  test?: string;
}) {
  try {
    const { limit = 200, page = 1, partKey, level, test } = params || {};
    const query = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    });
    if (partKey) query.set("partKey", partKey);
    if (level) query.set("level", level);
    if (test) query.set("test", test);

    const data = await serverFetch<{
      page: number;
      limit: number;
      total: number;
      items: any[];
    }>(`/api/practice/history?${query.toString()}`, {
      cache: "no-store",
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch practice history:", error);
    return { page: 1, limit: 200, total: 0, items: [] };
  }
}

/**
 * Fetch placement attempts
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getPlacementAttempts(params?: {
  limit?: number;
  page?: number;
}) {
  try {
    const { limit = 10, page = 1 } = params || {};
    const data = await serverFetch<{
      page: number;
      limit: number;
      total: number;
      items: any[];
    }>(`/api/placement/attempts?limit=${limit}&page=${page}`, {
      cache: "no-store",
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch placement attempts:", error);
    return { page: 1, limit: 10, total: 0, items: [] };
  }
}

/**
 * Fetch progress attempts
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getProgressAttempts(params?: {
  limit?: number;
  page?: number;
}) {
  try {
    const { limit = 10, page = 1 } = params || {};
    const data = await serverFetch<{
      page: number;
      limit: number;
      total: number;
      items: any[];
    }>(`/api/progress/attempts?limit=${limit}&page=${page}`, {
      cache: "no-store",
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch progress attempts:", error);
    return { page: 1, limit: 10, total: 0, items: [] };
  }
}

/**
 * Fetch dashboard goal data
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getDashboardGoal() {
  try {
    const data = await serverFetch<any>("/api/dashboard/goal", {
      cache: "no-store",
    });
    return data;
  } catch (error: any) {
    if (error.message?.includes("401")) return null;
    console.error("Failed to fetch dashboard goal:", error);
    return null;
  }
}

/**
 * Fetch dashboard activity data
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getDashboardActivity() {
  try {
    const data = await serverFetch<any>("/api/dashboard/activity", {
      cache: "no-store",
    });
    return data;
  } catch (error: any) {
    if (error.message?.includes("401")) return null;
    console.error("Failed to fetch dashboard activity:", error);
    return null;
  }
}

/**
 * Fetch community posts
 * Cache: revalidate 30s (public content, can be cached briefly)
 */
export async function getCommunityPosts(params?: {
  limit?: number;
  page?: number;
  sort?: string;
}) {
  try {
    const { limit = 20, page = 1, sort = "recent" } = params || {};
    const query = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sort,
    });
    const data = await serverFetch<{
      page: number;
      limit: number;
      total: number;
      items: any[];
    }>(`/api/community/posts?${query}`, {
      cache: "no-store", // Keep no-store for now as posts may be user-filtered
      // Future: could use revalidate: 30 for public posts
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch community posts:", error);
    return { page: 1, limit: 20, total: 0, items: [] };
  }
}

/**
 * Fetch single community post
 * Cache: revalidate 60s (public content, can be cached briefly)
 */
export async function getCommunityPost(postId: string) {
  try {
    const data = await serverFetch<any>(`/api/community/posts/${postId}`, {
      cache: "no-store", // Keep no-store for now as post may have user-specific data
      // Future: could use revalidate: 60 for public posts
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch community post:", error);
    return null;
  }
}

/**
 * Fetch badges
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getBadges() {
  try {
    const data = await serverFetch<{ badges: any[] }>("/api/badges", {
      cache: "no-store",
    });
    return data.badges || [];
  } catch (error: any) {
    if (error.message?.includes("401")) return [];
    console.error("Failed to fetch badges:", error);
    return [];
  }
}

/**
 * Fetch study schedules upcoming
 * Cache: no-store (user-specific, needs real-time data)
 */
export async function getStudyScheduleUpcoming() {
  try {
    const data = await serverFetch<{ data: any }>("/api/study-schedules/upcoming", {
      cache: "no-store",
    });
    return data.data || null;
  } catch (error: any) {
    if (error.message?.includes("401")) return null;
    console.error("Failed to fetch study schedule upcoming:", error);
    return null;
  }
}


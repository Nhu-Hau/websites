import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Clear all user-specific data from localStorage when user logs out or changes account
 */
export function clearUserData() {
  if (typeof window === "undefined") return;

  try {
    // Clear notifications
    const keysToRemove: string[] = [];
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove notification keys
      if (key.startsWith("notif:")) {
        keysToRemove.push(key);
      }
      // Remove practice inactivity keys
      else if (key.startsWith("practice:inactivity:nudged:")) {
        keysToRemove.push(key);
      }
      // Remove test autosave keys
      else if (key.startsWith("test_autosave_")) {
        keysToRemove.push(key);
      }
      // Remove vocabulary progress (user-specific)
      else if (key === "tp:vocabulary-progress") {
        keysToRemove.push(key);
      }
      // Remove forum state (user-specific)
      else if (key === "community-forum-state-v1") {
        keysToRemove.push(key);
      }
    }

    // Remove all identified keys
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`[clearUserData] Failed to remove ${key}:`, e);
      }
    });

    console.log(`[clearUserData] Cleared ${keysToRemove.length} user-specific keys`);
  } catch (e) {
    console.error("[clearUserData] Error clearing user data:", e);
  }
}


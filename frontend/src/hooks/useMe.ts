// src/hooks/useMe.ts
"use client";
import { useEffect, useState } from "react";

export type Me = { id: string; email?: string; name?: string } | null;

export function useMe() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setMe({ id: data.id, email: data.email, name: data.name });
        } else {
          setMe(null);
        }
      } catch {
        setMe(null);
      } finally {
        alive = false;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { me, loading };
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function MobileCommunityPage() {
  const base = useBasePrefix();
  const router = useRouter();

  useEffect(() => {
    // Redirect to main community page
    router.replace(`${base}/community`);
  }, [base, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-14 pb-20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}


"use client";

import React from "react";
import { Hash, Users, TrendingUp } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ExploreClient() {
  const basePrefix = useBasePrefix();
  const [trendingHashtags, setTrendingHashtags] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch trending hashtags
    fetch(`${API_BASE}/api/community/hashtags/trending`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setTrendingHashtags(data.items);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Khám phá
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Khám phá nội dung mới và người dùng thú vị
        </p>
      </div>

      {/* Trending Hashtags */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Hashtag đang thịnh hành
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : trendingHashtags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingHashtags.map((tag) => (
              <Link
                key={tag._id}
                href={`${basePrefix}/community/hashtag/${tag.name}`}
                className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    #{tag.name}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {tag.postsCount} bài viết
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400 text-center py-8">
            Chưa có hashtag nào
          </p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`${basePrefix}/community/trending`}
          className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-shadow"
        >
          <TrendingUp className="h-8 w-8 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Xu hướng</h3>
          <p className="text-blue-100">Xem các bài viết đang hot</p>
        </Link>

        <Link
          href={`${basePrefix}/community/groups`}
          className="p-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white hover:shadow-lg transition-shadow"
        >
          <Users className="h-8 w-8 mb-3" />
          <h3 className="text-xl font-semibold mb-2">Nhóm học</h3>
          <p className="text-green-100">Tham gia các nhóm học tập</p>
        </Link>
      </div>
    </div>
  );
}





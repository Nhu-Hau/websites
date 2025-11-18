"use client";

import React from "react";
import { Users, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function GroupsClient() {
  const t = useTranslations("community.groups");
  const basePrefix = useBasePrefix();
  const router = useRouter();
  const [groups, setGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/community/groups`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setGroups(data.items);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {t("title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("description")}
          </p>
        </div>
        <button
          onClick={() => router.push(`${basePrefix}/community/groups/create`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          {t("create")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link
              key={group._id}
              href={`${basePrefix}/community/groups/${group._id}`}
              className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow"
            >
              {group.coverImage ? (
                <img
                  src={group.coverImage.startsWith("http") ? group.coverImage : `${API_BASE}${group.coverImage}`}
                  alt={group.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-white" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.membersCount || 0} {t("members")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {t("noGroups")}
          </p>
          <button
            onClick={() => router.push(`${basePrefix}/community/groups/create`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("createFirst")}
          </button>
        </div>
      )}
    </div>
  );
}



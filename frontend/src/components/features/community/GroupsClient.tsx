/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Image from "next/image";
import { Users, Plus, Search, Trash2 } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import { useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function GroupsClient() {
  const basePrefix = useBasePrefix();
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const { show: showConfirm, Modal } = useConfirmModal();
  const t = useTranslations("community.groups");

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

  const handleDelete = React.useCallback(
    (groupId: string) => {
      showConfirm(
        {
          title: t("delete.confirm.title"),
          message: t("delete.confirm.message"),
          icon: "warning",
          confirmText: t("delete.confirm.confirm"),
          cancelText: t("delete.confirm.cancel"),
          confirmColor: "red",
        },
        async () => {
          setDeletingId(groupId);
          try {
            const res = await fetch(
              `${API_BASE}/api/community/groups/${groupId}`,
              {
                method: "DELETE",
                credentials: "include",
              }
            );
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.message || t("delete.toast.error"));
            }
            setGroups((prev) => prev.filter((g) => g._id !== groupId));
            toast.success(t("delete.toast.success"));
          } catch (e: any) {
            toast.error(e?.message || t("delete.toast.error"));
          } finally {
            setDeletingId(null);
          }
        }
      );
    },
    [showConfirm, t]
  );

  const filteredGroups = React.useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter((g) => {
      const name = (g.name || "").toLowerCase();
      const desc = (g.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [groups, search]);

  return (
    <>
      {Modal}
      <div className="space-y-8">
        {/* Header + Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("header.title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("header.description")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("actions.searchPlaceholder")}
                className="w-full rounded-xl border border-zinc-200 bg-white px-9 py-2 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            {/* Create group button */}
            <button
              onClick={() =>
                router.push(`${basePrefix}/community/groups/create`)
              }
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              {t("actions.create")}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("loading")}
              </p>
            </div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {filteredGroups.map((group) => {
              const adminId =
                typeof group.adminId === "object"
                  ? group.adminId?._id
                  : group.adminId;
              const isOwner =
                !!user?.id && adminId && String(adminId) === String(user.id);

              return (
                <div
                  key={group._id}
                  className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white/95 p-3 sm:p-4 shadow-sm ring-1 ring-black/[0.02] transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95"
                >
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(group._id)}
                      disabled={deletingId === group._id}
                      className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-red-200 bg-white/70 px-3 py-1 text-[11px] sm:text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
                    >
                      {deletingId === group._id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent dark:border-red-300" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {t("delete.button")}
                    </button>
                  )}

                  <Link
                    href={`${basePrefix}/community/groups/${group._id}`}
                    className="flex flex-1 flex-col"
                  >
                    {/* Cover */}
                    {group.coverImage ? (
                      <div className="relative mb-3 h-28 sm:h-32 w-full overflow-hidden rounded-xl">
                        <Image
                          src={
                            group.coverImage.startsWith("http")
                              ? group.coverImage
                              : `${API_BASE}${group.coverImage}`
                          }
                          alt={group.name}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="mb-3 flex h-28 sm:h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white">
                        <Users className="h-9 w-9 sm:h-10 sm:w-10" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex flex-1 flex-col">
                      <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                        {group.name}
                      </h3>
                      {/* {group.description && (
                        <p className="mb-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {group.description}
                        </p>
                      )} */}

                      <div className="mt-auto flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                        <span>
                          {t("card.memberCount", {
                            count: group.membersCount || 0,
                          })}
                        </span>
                        </span>
                        {group.visibility && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {group.visibility === "private"
                              ? t("card.visibility.private")
                              : t("card.visibility.public")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div >
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 sm:px-6 py-12 sm:py-16 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/95">
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
              <Users className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("empty.title")}
            </h3>
            <p className="mb-4 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              {t("empty.description")}
            </p>
            {/* <button
              onClick={() =>
                router.push(`${basePrefix}/community/groups/create`)
              }
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              Tạo nhóm đầu tiên
            </button> */}
          </div>
        )}
      </div>
    </>
  );
}

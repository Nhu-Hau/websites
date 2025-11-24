/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  listStudyRooms,
  deleteStudyRoom,
  createRoom,
} from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Users,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Lock,
  Clock,
  Activity,
  Plus,
  RefreshCw,
  Hash,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations, useLocale } from "next-intl";

type Role = "user" | "teacher" | "admin";

interface Room {
  roomName: string;
  numParticipants: number;
  createdAt: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AuthUser = ReturnType<typeof useAuth>["user"];

interface CreateStudyRoomProps {
  onCreated?: () => void;
  onCancel?: () => void;
}

function slugifyRoom(input: string): string {
  return input
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

type RoomValidationKey = "empty" | "min" | "max" | "pattern";

function validateRoom(slug: string): RoomValidationKey | null {
  if (!slug) return "empty";
  if (slug.length < 3) return "min";
  if (slug.length > 32) return "max";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return "pattern";
  }
  return null;
}

function CreateStudyRoom({ onCreated, onCancel }: CreateStudyRoomProps = {}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user: authUser, loading: authLoading } = useAuth();
  const t = useTranslations("study.createRoom");

  const role: Role = (authUser?.role as Role) || "user";
  const displayName = authUser?.name || "Guest";
  const userId =
    authUser?.id ||
    `guest-${typeof crypto !== "undefined" ? crypto.randomUUID() : "temp"}`;

  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;

  const normalized = useMemo(() => slugifyRoom(input), [input]);
  const finalSlug = normalized;
  const errorKey = useMemo(() => validateRoom(finalSlug), [finalSlug]);
  const errorMsg = errorKey ? t(`validation.${errorKey}`) : null;
  const isValid = !errorKey;

  const canCreateRoom = role === "teacher" || role === "admin";

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;
      raw = raw.replace(/\s+/g, "");
      raw = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      raw = raw.replace(/[^a-zA-Z0-9-]/g, "");
      raw = raw.toLowerCase();

      setInput(raw);
    },
    []
  );

  const onCreate = useCallback(async () => {
    if (!isValid) {
      toast.error(errorMsg || t("toast.invalidName"));
      return;
    }

    if (!canCreateRoom) {
      toast.error(t("toast.noPermission.title"), {
        description: t("toast.noPermission.description"),
      });
      return;
    }

    setLoading(true);
    try {
      const u = { id: userId, name: displayName, role };
      await createRoom(finalSlug, u);
      onCreated?.();
      toast.success(t("toast.createSuccess.title"), {
        description: t("toast.createSuccess.description"),
        duration: 1800,
      });
      router.push(`${basePrefix}/study/${finalSlug}`);
    } catch (e: any) {
      const message = e?.message || t("toast.createError");
      if (message.includes("teacher") || message.includes("admin")) {
        toast.error(t("toast.noPermission.title"), {
          description: t("toast.noPermission.description"),
        });
      } else {
        toast.error(t("toast.genericError"), { description: message });
      }
    } finally {
      setLoading(false);
    }
  }, [
    isValid,
    errorMsg,
    canCreateRoom,
    userId,
    displayName,
    role,
    finalSlug,
    onCreated,
    router,
    basePrefix,
  ]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading && !authLoading && isValid) {
        e.preventDefault();
        onCreate();
      }
    },
    [loading, authLoading, isValid, onCreate]
  );

  if (!authUser) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-lg ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
              {t("states.unauthenticated.title")}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("states.unauthenticated.description")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canCreateRoom) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-lg ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
              {t("states.forbidden.title")}
            </h3>
            <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("states.forbidden.roleLabel")}{" "}
              <span className="capitalize font-medium text-rose-600 dark:text-rose-400">
                {role}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {t("states.forbidden.contact")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-black/30">
      <div className="flex items-start gap-3 px-6 pt-6 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-900/20">
          <Hash className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t("form.title")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("form.description")}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-4 space-y-4">
        <div>
          <label
            htmlFor={fieldId}
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t("form.nameLabel")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Hash className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            </div>
            <input
              id={fieldId}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder={t("form.placeholder")}
              className={cn(
                "block w-full rounded-xl border bg-white px-10 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500",
                isValid
                  ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60 dark:border-emerald-700/60"
                  : errorMsg
                  ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/60 dark:border-red-700/70"
                  : "border-zinc-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60 dark:border-zinc-700"
              )}
              autoComplete="off"
              aria-invalid={!isValid}
              aria-describedby={`${helpId} ${!isValid ? errId : ""}`}
              disabled={loading}
            />
          </div>

          <div className="mt-2 min-h-[18px]">
            {isValid ? (
              <p
                id={helpId}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle className="h-4 w-4" />
                {t("form.helperValid")}
              </p>
            ) : errorMsg ? (
              <p
                id={errId}
                className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer giống ConfirmModal */}
      <div className="mt-1 flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 rounded-b-2xl">
        <button
          type="button"
          onClick={() => onCancel?.()}
          disabled={loading}
          className={cn(
            "inline-flex items-center justify-center px-4 py-2.5 rounded-lg",
            "text-sm font-medium transition-all duration-150",
            "border border-zinc-300 dark:border-zinc-700",
            "bg-white dark:bg-zinc-900",
            "text-zinc-700 dark:text-zinc-200",
            "hover:bg-zinc-50 dark:hover:bg-zinc-800",
            "focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {t("form.cancel")}
        </button>

        <button
          type="button"
          onClick={onCreate}
          disabled={loading || authLoading || !isValid}
          className={cn(
            "inline-flex items-center justify-center px-5 py-2.5 rounded-lg",
            "text-sm font-semibold transition-all duration-150",
            "shadow-sm hover:shadow-md active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900",
            loading || !isValid
              ? "bg-zinc-300 dark:bg-zinc-700 text-white cursor-not-allowed"
              : "bg-sky-600 dark:bg-sky-500 text-white hover:bg-sky-700 dark:hover:bg-sky-400",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("form.submitting")}
            </>
          ) : (
            t("form.submit")
          )}
        </button>
      </div>
    </div>
  );
}

export default function CreateStudyRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const role = (user?.role as Role) || "user";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const canCreate = isAdmin || isTeacher;
  const canDelete = isAdmin;
  const { show, Modal: ConfirmModal } = useConfirmModal();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const basePrefix = useBasePrefix();
  const pageT = useTranslations("study.rooms");
  const headerT = useTranslations("study.header");
  const createT = useTranslations("study.createRoom");
  const locale = useLocale();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale === "vi" ? "vi-VN" : "en-US",
        { dateStyle: "medium", timeStyle: "short" }
      ),
    [locale]
  );

  const reload = useCallback(async () => {
    if (!user?.id || !user?.name) return;
    try {
      setBusy("reload");
      setErr(null);
      const data = await listStudyRooms({
        id: user.id,
        name: user.name,
        role: user.role,
      });
      setRooms(data.rooms || []);
    } catch (e: any) {
      const msg = e?.message || createT("toast.listError");
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }, [user, createT]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  // Auto-delete empty rooms after 5 minutes
  useEffect(() => {
    if (!canDelete || !user?.id) return;

    const checkEmptyRooms = setInterval(async () => {
      try {
        const data = await listStudyRooms({
          id: user.id,
          name: user.name || "",
          role: user.role || "admin",
        });

        const currentRooms = data.rooms || [];

        for (const room of currentRooms) {
          if (room.numParticipants === 0) {
            const roomAge = Date.now() - new Date(room.createdAt).getTime();
            const fiveMinutes = 5 * 60 * 1000;

            if (roomAge >= fiveMinutes) {
              try {
                await deleteStudyRoom(room.roomName, {
                  id: user.id,
                  name: user.name || "",
                  role: user.role || "admin",
                });
                toast.info(createT("toast.autoDelete", { room: room.roomName }));
                setTimeout(() => reload(), 1000);
              } catch (e: any) {
                console.error("Auto-delete failed:", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Auto-delete check failed:", e);
      }
    }, 60000);

    return () => clearInterval(checkEmptyRooms);
  }, [canDelete, user, reload]);

  const handleDelete = async (roomName: string) => {
    if (!user?.id || !user?.name || !canDelete) return;

    show(
      {
        title: createT("dialogs.delete.title"),
        message: createT("dialogs.delete.message", { room: roomName }),
        icon: "warning",
        confirmText: createT("dialogs.delete.confirm"),
        cancelText: createT("dialogs.delete.cancel"),
        confirmColor: "red",
      },
      async () => {
        setDeleting(roomName);
        try {
          await deleteStudyRoom(roomName, {
            id: user.id,
            name: user.name || "",
            role: user.role || "admin",
          });
          toast.success(createT("toast.deleteSuccess", { room: roomName }));
          await reload();
        } catch (e: any) {
          const errorMsg =
            e?.message ||
            e?.response?.data?.message ||
            createT("toast.deleteError");
          toast.error(errorMsg);
          console.error("Delete room error:", e);
        } finally {
          setDeleting(null);
        }
      }
    );
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {createT("page.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="mb-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {pageT("hero.title")}
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {pageT("hero.description")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 md:flex-nowrap md:gap-3">
                {canCreate && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {headerT("create.full")}
                    </span>
                    <span className="sm:hidden">{headerT("create.short")}</span>
                  </button>
                )}

                <button
                  onClick={reload}
                  disabled={busy === "reload"}
                  className={cn(
                    "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    busy === "reload"
                      ? "cursor-not-allowed text-zinc-400 dark:text-zinc-500"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  {busy === "reload" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {headerT("refresh.full")}
                  </span>
                  <span className="sm:hidden">
                    {headerT("refresh.short")}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* Create Room Modal */}
          {showCreateModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm"
              onClick={(e) =>
                e.target === e.currentTarget && setShowCreateModal(false)
              }
            >
              <div
                className="w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-2xl p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <CreateStudyRoom
                  onCreated={() => {
                    setShowCreateModal(false);
                    reload();
                    toast.success(createT("toast.modalSuccess"));
                  }}
                  onCancel={() => setShowCreateModal(false)}
                />
              </div>
            </div>
          )}

          {/* Teacher Register Notice (dành cho Học viên & Giáo viên) */}
          {!canCreate && (
            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 sm:p-5 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                {/* Icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <Lock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>

                {/* Nội dung */}
                <div className="flex-1 space-y-4">
                  {/* Phần cho học viên */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/90 dark:text-amber-300">
                      {pageT("notice.student.badge")}
                    </p>
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                      {pageT("notice.student.title")}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-300">
                      {pageT.rich("notice.student.description", {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                    <ul className="mt-1 space-y-1 text-xs sm:text-sm text-zinc-800 dark:text-zinc-300">
                      <li className="flex gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                        <span>{pageT("notice.student.tips.link")}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                        <span>
                          {pageT.rich("notice.student.tips.list", {
                            highlight: (chunks) => <b>{chunks}</b>,
                          })}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Divider nhỏ */}
                  <div className="h-px w-full bg-amber-200/80 dark:bg-amber-800/70" />

                  {/* Phần cho giáo viên – gom chung trong nền vàng */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {pageT("notice.teacher.title")}
                    </p>
                    <p className="text-[11px] sm:text-xs leading-relaxed text-zinc-800 dark:text-zinc-300">
                      {pageT("notice.teacher.description")}
                    </p>

                    <Link
                      href={`${basePrefix}/study/teacher-register`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md dark:bg-amber-500 dark:hover:bg-amber-400"
                    >
                      <Users className="h-4 w-4" />
                      {pageT("notice.teacher.cta")}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Error Alert */}
          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-red-800 dark:text-red-200">
                    {err}
                  </p>
                  <button
                    onClick={reload}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    {pageT("errors.retry")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Room List */}
          <section className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {pageT("list.title")}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {rooms.length}
              </span>
            </div>

            {/* Empty state */}
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 sm:px-6 py-12 sm:py-16 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
                <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>

                <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {pageT("list.empty.title")}
                </h3>

                {canCreate ? (
                  <>
                    <p className="mb-4 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                      {pageT("list.empty.creator")}
                    </p>
                    {/* <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md dark:bg-sky-500 dark:hover:bg-sky-400"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Tạo phòng đầu tiên
                    </button> */}
                  </>
                ) : (
                  <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                    {pageT("list.empty.student")}
                  </p>
                )}
              </div>
            ) : (
              // List rooms
              <div className="grid grid-cols-1 gap-3">
                {rooms.map((r) => (
                  <div
                    key={r.roomName}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: info */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                            {r.roomName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <Activity className="h-3 w-3" />
                            {pageT("list.card.online", {
                              count: r.numParticipants,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                          <Clock className="h-3.5 w-3.5" />
                          {dateFormatter.format(new Date(r.createdAt))}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`${basePrefix}/study/${r.roomName}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 sm:w-auto"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {pageT("list.card.join")}
                        </Link>

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(r.roomName)}
                            disabled={deleting === r.roomName}
                            className={cn(
                              "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:ring-2 focus:ring-red-500 sm:w-auto",
                              deleting === r.roomName
                                ? "cursor-not-allowed border-red-300 text-red-600 opacity-60 dark:border-red-700 dark:text-red-400"
                                : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            )}
                          >
                            {deleting === r.roomName ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {pageT("list.card.deleting")}
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  {pageT("list.card.delete")}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {ConfirmModal}
    </div>
  );
}

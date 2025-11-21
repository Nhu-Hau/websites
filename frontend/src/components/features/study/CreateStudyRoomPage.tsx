/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  listStudyRooms,
  deleteStudyRoom,
  createRoom,
  createTeacherLead,
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
  UploadCloud,
  Paperclip,
  GraduationCap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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

interface TeacherLeadFormValues {
  fullName: string;
  email: string;
  phone: string;
  scoreOrCert: string;
  experience: string;
  availability: string;
  message: string;
}

interface TeacherRegisterModalProps {
  user: AuthUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

function TeacherRegisterModal({
  user,
  onClose,
  onSuccess,
}: TeacherRegisterModalProps) {
  const [form, setForm] = useState<TeacherLeadFormValues>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    scoreOrCert: "",
    experience: "",
    availability: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = React.useState<File[]>([]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.name || "",
      email: prev.email || user?.email || "",
    }));
  }, [user?.name, user?.email]);

  const updateField = useCallback(
    (field: keyof TeacherLeadFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...attachments, ...files].slice(0, 5); // tối đa 5 file
    setAttachments(next);
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    const { fullName, email, phone, scoreOrCert, experience, availability } =
      form;

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !scoreOrCert.trim() ||
      !experience.trim() ||
      !availability.trim()
    ) {
      toast.error("Vui lòng điền đầy đủ tất cả các trường bắt buộc.");
      return;
    }

    setSubmitting(true);
    try {
      await createTeacherLead({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        scoreOrCert: scoreOrCert.trim(),
        experience: experience.trim(),
        availability: availability.trim(),
        message: form.message.trim(),
        // nếu sau này bạn muốn gửi attachments lên backend thì xử lý thêm ở đây
      });
      toast.success(
        "Đã gửi thông tin đăng ký giáo viên. Admin sẽ liên hệ nếu hồ sơ phù hợp."
      );
      onSuccess();
    } catch (error: any) {
      const message =
        error?.message || "Gửi thông tin thất bại. Vui lòng thử lại sau.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, onSuccess]);

  return (
    <div
      className="w-full max-w-sm sm:max-w-lg mx-auto rounded-2xl border border-zinc-200/80 bg-white/95 px-3.5 py-4 sm:px-5 sm:py-5 shadow-xl ring-1 ring-black/5 dark:border-zinc-800/80 dark:bg-zinc-900/95
      max-h-[85vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
            Đăng ký trở thành giáo viên
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
            Điền thông tin liên hệ và năng lực giảng dạy để ban quản trị xem xét
            hồ sơ của bạn.
          </p>
        </div>
      </div>

      {/* Body */}
      <form
        className="mt-3 space-y-3 sm:mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitting) handleSubmit();
        }}
      >
        {/* Họ tên / Email */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="teacher-full-name"
              className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              id="teacher-full-name"
              value={form.fullName}
              onChange={updateField("fullName")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
              placeholder="Nguyễn Văn A"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="teacher-email"
              className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="teacher-email"
              type="email"
              value={form.email}
              onChange={updateField("email")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
              placeholder="giaovien@example.com"
              disabled={submitting}
            />
          </div>
        </div>

        {/* SĐT / Điểm số */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="teacher-phone"
              className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              id="teacher-phone"
              type="tel"
              value={form.phone}
              onChange={updateField("phone")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
              placeholder="Ví dụ: 0912 345 678"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="teacher-score"
              className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Điểm số / Chứng chỉ <span className="text-rose-500">*</span>
            </label>
            <input
              id="teacher-score"
              value={form.scoreOrCert}
              onChange={updateField("scoreOrCert")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
              placeholder="TOEIC 900, IELTS 7.5..."
              disabled={submitting}
            />
          </div>
        </div>

        {/* Kinh nghiệm */}
        <div className="space-y-1">
          <label
            htmlFor="teacher-experience"
            className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Kinh nghiệm giảng dạy <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="teacher-experience"
            value={form.experience}
            onChange={updateField("experience")}
            className="min-h-[60px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            placeholder="Tóm tắt ngắn gọn kinh nghiệm giảng dạy của bạn."
            disabled={submitting}
          />
        </div>

        {/* Upload chứng chỉ / bằng cấp */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tệp / Ảnh chứng chỉ, bằng cấp
            </label>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              PDF, JPG, PNG · tối đa 5
            </span>
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.5 text-center text-[11px] text-zinc-500 transition hover:border-amber-400 hover:bg-amber-50/60 sm:px-4 sm:py-3 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-amber-500 dark:hover:bg-zinc-900/80">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-100">
              <UploadCloud className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <span>Nhấn để chọn tệp</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Bảng điểm, chứng chỉ hoặc giấy tờ liên quan (nếu có).
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFilesChange}
              disabled={submitting}
            />
          </label>

          {attachments.length > 0 && (
            <div className="space-y-1 rounded-xl bg-zinc-50/80 p-2.5 text-xs dark:bg-zinc-900/80">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Tệp đã chọn ({attachments.length})
              </p>
              <ul className="space-y-1">
                {attachments.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-[11px] shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-950/60 dark:ring-zinc-800"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                      <span className="truncate text-[11px] text-zinc-700 dark:text-zinc-200">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-[10px] font-medium text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Thời gian / Ghi chú */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="teacher-availability"
              className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Thời gian có thể giảng dạy{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="teacher-availability"
              value={form.availability}
              onChange={updateField("availability")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
              placeholder="Ví dụ: tối 2–4–6, cuối tuần."
              disabled={submitting}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:w-auto"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-500 dark:hover:bg-amber-400 dark:focus:ring-offset-zinc-900 sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi thông tin"
            )}
          </button>
        </div>
      </form>
    </div>
  );
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

function validateRoom(slug: string): string | null {
  if (!slug) return "Tên phòng không được để trống.";
  if (slug.length < 3) return "Tên phòng phải có ít nhất 3 ký tự.";
  if (slug.length > 32) return "Tên phòng tối đa 32 ký tự.";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return "Chỉ dùng chữ thường, số và dấu gạch (-), không bắt đầu bằng dấu gạch.";
  }
  return null;
}

function CreateStudyRoom({ onCreated, onCancel }: CreateStudyRoomProps = {}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user: authUser, loading: authLoading } = useAuth();

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
  const errorMsg = useMemo(() => validateRoom(finalSlug), [finalSlug]);
  const isValid = !errorMsg && finalSlug.length >= 3;

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
      toast.error(errorMsg || "Tên phòng không hợp lệ");
      return;
    }

    if (!canCreateRoom) {
      toast.error("Bạn không có quyền tạo phòng học", {
        description:
          "Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.",
      });
      return;
    }

    setLoading(true);
    try {
      const u = { id: userId, name: displayName, role };
      await createRoom(finalSlug, u);
      onCreated?.();
      toast.success("Phòng đã được tạo!", {
        description: "Đang chuyển đến phòng học…",
        duration: 1800,
      });
      router.push(`${basePrefix}/study/${finalSlug}`);
    } catch (e: any) {
      const message = e?.message || "Không thể tạo phòng. Vui lòng thử lại.";
      if (message.includes("teacher") || message.includes("admin")) {
        toast.error("Bạn không có quyền tạo phòng học", {
          description:
            "Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.",
        });
      } else {
        toast.error("Tạo phòng thất bại", { description: message });
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
              Yêu cầu đăng nhập
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Vui lòng đăng nhập để tạo phòng học. Chỉ giáo viên và quản trị
              viên mới có thể tạo phòng.
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
              Không có quyền tạo phòng
            </h3>
            <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
              Vai trò hiện tại:{" "}
              <span className="capitalize font-medium text-rose-600 dark:text-rose-400">
                {role}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Liên hệ quản trị viên để được cấp quyền giáo viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-black/30">
      {/* Header: Icon + Title + Mô tả */}
      <div className="flex items-start gap-3 px-6 pt-6 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-900/20">
          <Hash className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Tạo phòng học mới
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Nhập tên phòng học để bắt đầu buổi học trực tuyến.
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
            Tên phòng học
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
              placeholder="toeic-lr-class"
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
                Tên phòng hợp lệ.
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
          Hủy
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
              Đang tạo…
            </>
          ) : (
            "Tạo phòng"
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
  const [showTeacherRegisterModal, setShowTeacherRegisterModal] =
    useState(false);

  const basePrefix = useBasePrefix();

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
      const msg = e?.message || "Không thể tải danh sách phòng";
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }, [user]);

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
                toast.info(
                  `Đã tự động xóa phòng trống sau 5 phút: ${room.roomName}`
                );
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
        title: "Xác nhận xóa",
        message: `Bạn có chắc muốn xóa phòng "${roomName}"? Hành động này không thể hoàn tác.`,
        icon: "warning",
        confirmText: "Xóa",
        cancelText: "Hủy",
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
          toast.success(`Đã xóa phòng "${roomName}"`);
          await reload();
        } catch (e: any) {
          const errorMsg =
            e?.message || e?.response?.data?.message || "Xóa phòng thất bại";
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
            Đang tải…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-1 text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Phòng học
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Theo dõi phòng đang mở, tạo phòng hoặc tham gia khi có liên kết.
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
                  <span className="hidden sm:inline">Tạo phòng</span>
                  <span className="sm:hidden">Tạo</span>
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
                <span className="hidden sm:inline">Làm mới</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
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
                    toast.success("Tạo phòng thành công!");
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
                      Dành cho học viên
                    </p>
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                      Tài khoản của bạn chỉ dùng để tham gia phòng học
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-300">
                      Chỉ <strong>giáo viên</strong> và{" "}
                      <strong>quản trị viên</strong> mới có thể tạo phòng trực
                      tuyến. Khi giáo viên mở phòng, bạn có thể:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs sm:text-sm text-zinc-800 dark:text-zinc-300">
                      <li className="flex gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                        <span>
                          Nhận link tham gia phòng từ giáo viên (qua chat,
                          email,…).
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                        <span>
                          Hoặc chọn phòng trong mục <b>“Danh sách phòng”</b> bên
                          dưới nếu đang mở.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Divider nhỏ */}
                  <div className="h-px w-full bg-amber-200/80 dark:bg-amber-800/70" />

                  {/* Phần cho giáo viên – gom chung trong nền vàng */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      Bạn là giáo viên TOEIC / IELTS?
                    </p>
                    <p className="text-[11px] sm:text-xs leading-relaxed text-zinc-800 dark:text-zinc-300">
                      Nếu bạn có kinh nghiệm giảng dạy và muốn mở lớp trên nền
                      tảng này, hãy gửi thông tin để admin xem xét và cấp quyền
                      giáo viên nếu hồ sơ phù hợp.
                    </p>

                    <button
                      onClick={() => setShowTeacherRegisterModal(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md dark:bg-amber-500 dark:hover:bg-amber-400"
                    >
                      <Users className="h-4 w-4" />
                      Gửi thông tin đăng ký giáo viên
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Teacher Register Modal */}
          {showTeacherRegisterModal && (
            <div
              className="fixed inset-x-0 bottom-0 top-8 z-[60] flex items-start justify-center bg-black/45 backdrop-blur-sm px-3 sm:px-4 py-4"
              onClick={(e) =>
                e.target === e.currentTarget &&
                setShowTeacherRegisterModal(false)
              }
            >
              <TeacherRegisterModal
                user={user}
                onClose={() => setShowTeacherRegisterModal(false)}
                onSuccess={() => setShowTeacherRegisterModal(false)}
              />
            </div>
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
                    Thử lại ngay
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
                Danh sách phòng
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
                  Chưa có phòng nào
                </h3>

                {canCreate ? (
                  <>
                    <p className="mb-4 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                      Bạn chưa tạo phòng học nào. Hãy mở phòng đầu tiên để học
                      TOEIC cùng học viên.
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
                    Hiện chưa có phòng học nào được mở. Hãy quay lại sau hoặc
                    liên hệ giáo viên/quản trị viên.
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
                            {r.numParticipants} online
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(r.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`${basePrefix}/study/${r.roomName}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 sm:w-auto"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Vào phòng
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
                                Đang xóa
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Xóa</span>
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

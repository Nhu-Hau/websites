"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTeacherLead } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Loader2,
  UploadCloud,
  Paperclip,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import Link from "next/link";

interface TeacherLeadFormValues {
  fullName: string;
  email: string;
  phone: string;
  scoreOrCert: string;
  experience: string;
  availability: string;
  message: string;
}

export default function TeacherRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const basePrefix = useBasePrefix();

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
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

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
        });
        setSubmitted(true);
        toast.success(
          "Đã gửi thông tin đăng ký giáo viên. Admin sẽ liên hệ nếu hồ sơ phù hợp."
        );
      } catch (error: any) {
        const message =
          error?.message || "Gửi thông tin thất bại. Vui lòng thử lại sau.";
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [form]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <main className="mx-auto max-w-3xl px-4 py-6 lg:py-8 pt-20 lg:pt-24 pb-20 lg:pb-8">
          <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-6 sm:p-8 shadow-xl ring-1 ring-black/5 dark:border-emerald-800/80 dark:bg-zinc-900/95">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  Đã gửi thành công!
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md">
                  Cảm ơn bạn đã gửi thông tin đăng ký giáo viên. Admin sẽ xem xét
                  hồ sơ và liên hệ với bạn trong thời gian sớm nhất nếu hồ sơ
                  phù hợp.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link
                  href={`${basePrefix}/study/create`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại phòng học
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-3xl px-4 py-6 lg:py-8 pt-20 lg:pt-24 pb-20 lg:pb-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`${basePrefix}/study/create`}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại phòng học
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                Đăng ký trở thành giáo viên
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Điền thông tin liên hệ và năng lực giảng dạy để ban quản trị xem
                xét hồ sơ của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-6 sm:px-6 sm:py-8 shadow-xl ring-1 ring-black/5 dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Họ tên / Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="teacher-full-name"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-full-name"
                  value={form.fullName}
                  onChange={updateField("fullName")}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                  placeholder="Nguyễn Văn A"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="teacher-email"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-email"
                  type="email"
                  value={form.email}
                  onChange={updateField("email")}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                  placeholder="giaovien@example.com"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* SĐT / Điểm số */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="teacher-phone"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField("phone")}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                  placeholder="Ví dụ: 0912 345 678"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="teacher-score"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Điểm số / Chứng chỉ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-score"
                  value={form.scoreOrCert}
                  onChange={updateField("scoreOrCert")}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                  placeholder="TOEIC 900, IELTS 7.5..."
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Kinh nghiệm */}
            <div className="space-y-2">
              <label
                htmlFor="teacher-experience"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Kinh nghiệm giảng dạy <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="teacher-experience"
                value={form.experience}
                onChange={updateField("experience")}
                rows={4}
                className="min-h-[100px] w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                placeholder="Tóm tắt ngắn gọn kinh nghiệm giảng dạy của bạn."
                disabled={submitting}
                required
              />
            </div>

            {/* Upload chứng chỉ / bằng cấp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tệp / Ảnh chứng chỉ, bằng cấp
                </label>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  PDF, JPG, PNG · tối đa 5
                </span>
              </div>

              <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-center transition hover:border-amber-400 hover:bg-amber-50/60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-amber-500 dark:hover:bg-zinc-900/80">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-100">
                  <UploadCloud className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <span>Nhấn để chọn tệp</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                <div className="space-y-2 rounded-xl bg-zinc-50/80 p-3 text-sm dark:bg-zinc-900/80">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Tệp đã chọn ({attachments.length})
                  </p>
                  <ul className="space-y-2">
                    {attachments.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-950/60 dark:ring-zinc-800"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Paperclip className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="truncate text-zinc-700 dark:text-zinc-200">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-xs font-medium text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400"
                          disabled={submitting}
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Thời gian */}
            <div className="space-y-2">
              <label
                htmlFor="teacher-availability"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Thời gian có thể giảng dạy{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="teacher-availability"
                value={form.availability}
                onChange={updateField("availability")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                placeholder="Ví dụ: tối 2–4–6, cuối tuần."
                disabled={submitting}
                required
              />
            </div>

            {/* Ghi chú thêm */}
            <div className="space-y-2">
              <label
                htmlFor="teacher-message"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Ghi chú thêm (tùy chọn)
              </label>
              <textarea
                id="teacher-message"
                value={form.message}
                onChange={updateField("message")}
                rows={3}
                className="min-h-[80px] w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                placeholder="Bất kỳ thông tin bổ sung nào bạn muốn chia sẻ..."
                disabled={submitting}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
              <Link
                href={`${basePrefix}/study/create`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:w-auto"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-500 dark:hover:bg-amber-400 dark:focus:ring-offset-zinc-900 sm:w-auto"
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
      </main>
    </div>
  );
}


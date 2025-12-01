"use client";

import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionId: string;
    testId: string; // e.g., "part.1-1-1"
}

export default function ReportModal({
    isOpen,
    onClose,
    questionId,
    testId,
}: ReportModalProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    questionId,
                    testId,
                    content,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit report");

            toast.success("Cảm ơn bạn đã báo lỗi! Chúng tôi sẽ kiểm tra sớm.");
            setContent("");
            onClose();
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-100 flex items-center gap-2"
                                    >
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        Báo lỗi câu hỏi
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <X className="h-5 w-5 text-zinc-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-2">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                            Mô tả lỗi bạn gặp phải:
                                        </label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                                            placeholder="Ví dụ: Đáp án sai, Audio không nghe được, Lỗi hiển thị..."
                                            required
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-lg border border-transparent bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-lg border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                            Gửi báo cáo
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

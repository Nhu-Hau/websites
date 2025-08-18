"use client";

import { useEffect, useRef, useState } from "react";
import { FiMessageSquare, FiX, FiSend } from "react-icons/fi";
import { SiOpenai } from "react-icons/si";
import { useTranslations } from "next-intl";
import useClickOutside from "@/hooks/useClickOutside";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatBox() {
  const t = useTranslations("chat"); // ✅ thêm hook i18n
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false));

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Msg = {
      id: uid(),
      role: "user",
      content: text,
      at: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Demo reply giả lập
    await new Promise((r) => setTimeout(r, 300));
    const assistantMsg: Msg = {
      id: uid(),
      role: "assistant",
      content: t("demoReply"), // ✅ dùng i18n
      at: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    setSending(false);
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("closeChat") : t("openChat")}
        className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full
          bg-gradient-to-tr from-sky-500 to-indigo-500 text-white
          shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition
          dark:from-sky-500 dark:to-indigo-500"
      >
        {open ? (
          <FiX className="mx-auto h-6 w-6" />
        ) : (
          <FiMessageSquare className="mx-auto h-6 w-6" />
        )}
      </button>

      {/* Panel */}
      <div
        ref={wrapperRef}
        className={`fixed bottom-24 right-5 z-[59] w-[92vw] max-w-sm
          transition-all duration-200 ${
            open
              ? "opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 translate-y-2"
          }`}
      >
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur shadow-2xl dark:bg-gray-900/90 dark:border-gray-700">
          {/* Header */}
          <div
            className="relative flex items-center justify-between px-4 py-3
              bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900
              border-b border-gray-200/70 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl
                  bg-gradient-to-tr from-indigo-600 to-sky-600 text-white
                  shadow-sm dark:from-indigo-500 dark:to-sky-500"
              >
                <SiOpenai className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t("title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                focus:outline-none focus:ring-2 focus:ring-blue-400
                dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="max-h-[26rem] min-h-[14rem] overflow-y-auto
              px-3 py-3 space-y-3 bg-white/70 dark:bg-gray-900/70"
          >
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {t("empty")}
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-tr from-sky-600 to-indigo-500 text-white dark:from-sky-500 dark:to-indigo-400"
                        : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="mb-1 inline-flex items-center gap-1 text-[11px] opacity-80">
                        <SiOpenai className="h-3.5 w-3.5" />
                        <span>{t("ai")}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={`mt-1 text-[10px] ${
                        m.role === "user"
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {new Date(m.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200/70 p-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("placeholder")}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white/90 px-3 py-2 text-base sm:text-sm text-gray-900
                  placeholder:text-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-600
                  max-h-48 min-h-[3.5rem] dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-100
                  dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              />

              <button
                onClick={send}
                disabled={sending || input.trim().length === 0}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2
                  rounded-xl bg-sky-600 px-3 text-sm font-medium text-white
                  shadow-sm transition enabled:hover:bg-sky-700
                  enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-sky-400
                  disabled:opacity-50 dark:bg-sky-500 dark:enabled:hover:bg-sky-600"
              >
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    {t("sending")}
                  </span>
                ) : (
                  <>
                    <FiSend className="h-4 w-4" />
                    {t("send")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect } from "react";
import { X, AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmModalIcon = "warning" | "error" | "info" | "success";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  icon?: ConfirmModalIcon;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "red" | "blue" | "green" | "gray";
  loading?: boolean;
}

const iconConfig: Record<
  ConfirmModalIcon,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
};

const buttonConfig: Record<
  "red" | "blue" | "green" | "gray",
  { base: string; hover: string; focus: string }
> = {
  red: {
    base: "bg-red-600 dark:bg-red-500 text-white",
    hover: "hover:bg-red-700 dark:hover:bg-red-600",
    focus: "focus:ring-red-500",
  },
  blue: {
    base: "bg-blue-600 dark:bg-blue-500 text-white",
    hover: "hover:bg-blue-700 dark:hover:bg-blue-600",
    focus: "focus:ring-blue-500",
  },
  green: {
    base: "bg-green-600 dark:bg-green-500 text-white",
    hover: "hover:bg-green-700 dark:hover:bg-green-600",
    focus: "focus:ring-green-500",
  },
  gray: {
    base: "bg-zinc-700 dark:bg-zinc-500 text-white",
    hover: "hover:bg-zinc-800 dark:hover:bg-zinc-600",
    focus: "focus:ring-zinc-500",
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  icon = "warning",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmColor = "red",
  loading = false,
}: ConfirmModalProps) {
  const IconComponent = iconConfig[icon].icon;
  const iconStyles = iconConfig[icon];
  const buttonStyles = buttonConfig[confirmColor];

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose, loading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-3 py-6 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800",
          "bg-white/95 dark:bg-zinc-900/95 shadow-xl ring-1 ring-black/5",
          "overflow-hidden"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0",
                iconStyles.bg
              )}
            >
              <IconComponent className={cn("h-5 w-5 sm:h-6 sm:w-6", iconStyles.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="modal-title"
                className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight"
              >
                {title}
              </h3>
              {message && (
                <p
                  id="modal-description"
                  className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed"
                >
                  {message}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 px-4 sm:px-5 pb-4 sm:pb-5 pt-3 sm:pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              "flex-1 py-3 sm:py-3.5 rounded-xl border border-zinc-300",
              "bg-white dark:bg-zinc-900",
              "text-sm sm:text-base font-semibold text-zinc-700 dark:text-zinc-200",
              "hover:bg-zinc-50 dark:hover:bg-zinc-800",
              "dark:border-zinc-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2",
              "text-sm sm:text-base font-semibold text-white",
              "shadow-sm",
              buttonStyles.base,
              buttonStyles.hover,
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="hidden sm:inline">Đang xử lý...</span>
                <span className="sm:hidden">Đang xử lý</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useConfirmModal() {
  const [state, setState] = React.useState<{
    open: boolean;
    props: Omit<ConfirmModalProps, "open" | "onClose" | "onConfirm">;
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    props: {
      title: "",
    },
  });

  const show = React.useCallback(
    (
      props: Omit<ConfirmModalProps, "open" | "onClose" | "onConfirm">,
      onConfirm?: () => void | Promise<void>
    ) => {
      setState({
        open: true,
        props,
        onConfirm,
      });
    },
    []
  );

  const hide = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (state.onConfirm) {
      await state.onConfirm();
    }
    hide();
  }, [state.onConfirm, hide]);

  const Modal = React.useMemo(
    () => (
      <ConfirmModal
        {...state.props}
        open={state.open}
        onClose={hide}
        onConfirm={handleConfirm}
      />
    ),
    [state, hide, handleConfirm]
  );

  return { show, hide, Modal };
}











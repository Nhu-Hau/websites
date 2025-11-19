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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-sm sm:max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80",
          "bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-black/30",
          "transform transition-all duration-200 ease-out",
          open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-2"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Close button (top-right) */}
        <button
          onClick={onClose}
          disabled={loading}
          className={cn(
            "absolute right-3.5 top-3.5 inline-flex h-8 w-8 items-center justify-center rounded-full",
            "text-zinc-500 dark:text-zinc-400",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
            "hover:text-zinc-700 dark:hover:text-zinc-100",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Icon + Title center */}
        <div className="flex items-center text-center gap-3 px-6 pt-6 pb-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              iconStyles.bg
            )}
          >
            <IconComponent className={cn("w-6 h-6", iconStyles.color)} />
          </div>

          <h3
            id="modal-title"
            className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h3>
        </div>

        {/* Content */}
        {message && (
          <div className="px-6 pb-4">
            <p
              id="modal-description"
              className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
            >
              {message}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 rounded-b-2xl">
          <button
            onClick={onClose}
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
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "inline-flex items-center justify-center px-5 py-2.5 rounded-lg",
              "text-sm font-semibold transition-all duration-150",
              "shadow-sm hover:shadow-md active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900",
              buttonStyles.base,
              buttonStyles.hover,
              buttonStyles.focus,
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
            )}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Đang xử lý...
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






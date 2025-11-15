"use client";

import React from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ShowToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ShowToastOptions {
  id: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => string;
  success: (message: string, options?: Omit<ShowToastOptions, "message" | "variant">) => string;
  error: (message: string, options?: Omit<ShowToastOptions, "message" | "variant">) => string;
  info: (message: string, options?: Omit<ShowToastOptions, "message" | "variant">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timersRef = React.useRef<Record<string, number>>({});

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = React.useCallback(
    ({ title, message, variant = "info", duration = 3000 }: ShowToastOptions) => {
      const id = createId();
      const toast: ToastItem = { id, title, message, variant, duration };
      setToasts((prev) => [...prev, toast]);

      if (duration !== Infinity) {
        const timer = window.setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current[id] = timer;
      }

      return id;
    },
    [dismiss]
  );

  const success = React.useCallback(
    (message: string, options?: Omit<ShowToastOptions, "message" | "variant">) =>
      showToast({ message, variant: "success", ...options }),
    [showToast]
  );

  const error = React.useCallback(
    (message: string, options?: Omit<ShowToastOptions, "message" | "variant">) =>
      showToast({ message, variant: "error", ...options }),
    [showToast]
  );

  const info = React.useCallback(
    (message: string, options?: Omit<ShowToastOptions, "message" | "variant">) =>
      showToast({ message, variant: "info", ...options }),
    [showToast]
  );

  React.useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, dismiss }}>
      {children}
      <div className="fixed top-24 right-6 z-[1200] flex flex-col gap-3">
        {toasts.map((toast) => {
          const icon =
            toast.variant === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : toast.variant === "error" ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Info className="h-5 w-5 text-blue-500" />
            );

          const accentClass =
            toast.variant === "success"
              ? "border-green-200 bg-white/90"
              : toast.variant === "error"
              ? "border-red-200 bg-white/90"
              : "border-blue-200 bg-white/90";

          return (
            <div
              key={toast.id}
              className={`toast-enter relative overflow-hidden rounded-xl border shadow-lg transition-all duration-200 backdrop-blur-sm ${accentClass}`}
            >
              <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-teal-500 to-blue-500" />
              <div className="flex items-start gap-3 px-4 py-3 pl-5">
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1">
                  {toast.title && <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>}
                  <p className="text-sm text-zinc-600">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-full p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                  aria-label="Đóng thông báo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};


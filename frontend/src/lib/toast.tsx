/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
/**
 * Toast utility wrapper for notistack
 * Provides a consistent API with link navigation support
 */
import React from "react";
import { enqueueSnackbar, closeSnackbar, SnackbarKey, OptionsObject } from "notistack";

type ToastType = "success" | "error" | "info" | "warning" | "default";

interface ExtendedToastOptions {
  /** Link để navigate khi click vào toast */
  link?: string;
  /** onClick handler cho toast (sẽ được map sang SnackbarProps.onClick) */
  onClick?: () => void;
  /** ClassNames tương thích với react-toastify (map sang className) */
  classNames?: {
    toast?: string;
  };
  /** Description text (sẽ được combine với message) */
  description?: string;
  /** Duration tương thích với react-toastify (map sang autoHideDuration) */
  duration?: number;
  /** Action button với format { label, onClick } - sẽ được convert sang ReactNode */
  action?: {
    label: string;
    onClick: () => void;
  } | React.ReactNode;
  /** Other notistack options */
  [key: string]: unknown;
}

const createToast = (variant: ToastType) => {
  return (message: string | React.ReactNode, options?: ExtendedToastOptions): SnackbarKey => {
    const { link, onClick, classNames, description, duration, action, ...snackbarOptions } = options || {};
    
    // Combine message với description nếu có
    let finalMessage: string | React.ReactNode = message;
    if (description) {
      finalMessage = (
        <div>
          <div className="font-medium">{message}</div>
          <div className="text-sm opacity-90 mt-1">{description}</div>
        </div>
      );
    }
    
    // Nếu có link, tạo onClick handler để navigate
    const handleClick = link
      ? () => {
          if (typeof window !== "undefined") {
            // Dùng window.location để navigate (tương thích với Next.js)
            if (link.startsWith("http://") || link.startsWith("https://")) {
              window.location.href = link;
            } else {
              // Internal route - tự động thêm locale prefix nếu chưa có
              let finalLink = link;
              if (!link.startsWith("/")) {
                finalLink = `/${link}`;
              }
              // Lấy locale từ pathname hiện tại nếu link không có locale
              const currentPath = window.location.pathname;
              const localeMatch = currentPath.match(/^\/([a-z]{2})(\/|$)/);
              if (localeMatch && !finalLink.startsWith(`/${localeMatch[1]}/`)) {
                finalLink = `/${localeMatch[1]}${finalLink}`;
              }
              window.location.pathname = finalLink;
            }
          }
        }
      : onClick;
    
    // Map classNames.toast sang className cho notistack
    const className = classNames?.toast || snackbarOptions.className;
    
    // Map duration sang autoHideDuration
    const autoHideDuration = duration !== undefined ? duration : (link ? (options?.autoHideDuration ?? 5000) : 3000);
    
    // Convert action từ { label, onClick } sang ReactNode nếu cần
    let finalAction: React.ReactNode | undefined;
    if (action) {
      // Kiểm tra xem action có phải là object với label và onClick không
      if (
        typeof action === "object" &&
        action !== null &&
        !React.isValidElement(action) &&
        "label" in action &&
        "onClick" in action &&
        typeof (action as any).label === "string" &&
        typeof (action as any).onClick === "function"
      ) {
        // Convert { label, onClick } sang button element
        finalAction = (
          <button
            onClick={(action as { label: string; onClick: () => void }).onClick}
            className="ml-4 rounded-md px-3 py-1.5 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 transition-colors dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            {(action as { label: string; onClick: () => void }).label}
          </button>
        );
      } else {
        // Đã là ReactNode rồi
        finalAction = action as React.ReactNode;
      }
    }
    
    const baseOptions: OptionsObject = {
      variant,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
      autoHideDuration,
      preventDuplicate: true,
      className,
      ...(finalAction && { action: finalAction }),
      ...(handleClick && {
        SnackbarProps: {
          onClick: handleClick,
        },
      }),
      ...snackbarOptions,
    };
    
    return enqueueSnackbar(finalMessage, baseOptions);
  };
};

export const toast = {
  success: createToast("success"),
  error: createToast("error"),
  info: createToast("info"),
  warning: createToast("warning"),
  default: createToast("default"),
  dismiss: (snackbarId?: SnackbarKey) => {
    if (snackbarId) {
      closeSnackbar(snackbarId);
    }
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      pending?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    },
    options?: OptionsObject
  ): Promise<T> => {
    const pendingId = messages.pending
      ? enqueueSnackbar(messages.pending, { variant: "info", ...options })
      : undefined;

    return promise
      .then((data) => {
        if (pendingId) {
          closeSnackbar(pendingId);
        }
        const successMessage =
          typeof messages.success === "function"
            ? messages.success(data)
            : messages.success || "Thành công";
        enqueueSnackbar(successMessage, { variant: "success", ...options });
        return data;
      })
      .catch((error) => {
        if (pendingId) {
          closeSnackbar(pendingId);
        }
        const errorMessage =
          typeof messages.error === "function"
            ? messages.error(error)
            : messages.error || error?.message || "Đã xảy ra lỗi";
        enqueueSnackbar(errorMessage, { variant: "error", ...options });
        throw error;
      });
  },
};

export default toast;


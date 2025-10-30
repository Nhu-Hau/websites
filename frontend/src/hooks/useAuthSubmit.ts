/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuthSubmit.ts
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { postJson } from "@/lib/http";
import { validateAuth, hasAuthErrors, AuthErrors } from "@/utils/validation";

type Kind = "login" | "register" | "forgot";

type SubmitOpts = {
  kind: Kind;
  url: string;
  t: (k: string) => string;
  onSuccess?: (json: any) => void;
};

export function useAuthSubmit({ kind, url, t, onSuccess }: SubmitOpts) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd) as Record<string, string>;

    const validationErrors = validateAuth(kind, data, t);
    if (hasAuthErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Sử dụng postJson đúng cách, không destructure
      const json = await postJson(url, data);
      onSuccess?.(json);
    } catch (err: any) {
      const message = err?.message;
      // Nếu là lỗi email đã tồn tại thì báo lỗi dưới input email
      if (message?.includes("Email này đã được sử dụng") || message?.includes("đã được sử dụng")) {
        setErrors((e) => ({ ...e, email: message }));
      } else {
        toast.error(message || "Đã xảy ra lỗi, vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }

  return { onSubmit, loading, errors, setErrors };
}
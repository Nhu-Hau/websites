/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

    const errs = validateAuth(kind, data, t);
    if (hasAuthErrors(errs)) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { ok, json } = await postJson(url, data);
      if (!ok) {
        toast.error(json?.message || t("common.error"));
        return;
      }
      onSuccess?.(json);
    } catch (err) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return { onSubmit, loading, errors, setErrors };
}

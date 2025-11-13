//frontend/src/hooks/useBasePrefix.ts
"use client";
import { useParams, usePathname } from "next/navigation";

export function useBasePrefix(defaultLocale = "vi") {
  const params = useParams() as { locale?: string } | null;
  const pathname = usePathname();
  const locale =
    params?.locale ||
    pathname?.split("/").filter(Boolean)?.[0] || // lấy segment đầu
    defaultLocale;
  return `/${locale}`;
}
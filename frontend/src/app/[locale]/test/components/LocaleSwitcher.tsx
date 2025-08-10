// components/LocaleSwitcher.tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "../../../../../navigation";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
      router.refresh();
    }
  };

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="en">EN</option>
      <option value="vi">VI</option>
    </select>
  );
}

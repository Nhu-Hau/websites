// app/[locale]/page.tsx
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import LocaleSwitcher from "./components/LocaleSwitcher";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <>
      <div className="mt-96">
        <h1>{t("title")}</h1>
        <p>{t("welcomeMessage")}</p>
        <LocaleSwitcher/>
      </div>
    </>
  );
}

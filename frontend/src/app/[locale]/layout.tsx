// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import { cookies } from "next/headers";
import { ThemeProvider } from "../../context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { ToastContainer } from "react-toastify";
import CornerToast from "@/components/common/CornerToast";
import SocketBridge from "@/components/layout/SocketBridge";
import LayoutClient from "./layoutClient";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";

  return (
    <ThemeProvider defaultTheme={theme}>
      <NextIntlClientProvider locale={locale}>
        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </NextIntlClientProvider>
      <ToastContainer />
      <CornerToast />
      <SocketBridge />
    </ThemeProvider>
  );
}
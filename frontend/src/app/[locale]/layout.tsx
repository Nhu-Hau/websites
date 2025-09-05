// app/[locale]/layout.tsx (ví dụ đường dẫn, theo cấu trúc của bạn)
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import { cookies } from "next/headers";
import { ThemeProvider } from "../../context/ThemeContext";
import ChatBox from "../../components/common/ChatBox";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

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

  const theme =
    (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";

  return (
    <ThemeProvider defaultTheme={theme}>
      <NextIntlClientProvider locale={locale}>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <ChatBox />
          <Footer />
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

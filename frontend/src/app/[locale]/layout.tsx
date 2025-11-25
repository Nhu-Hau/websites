// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import { cookies } from "next/headers";
import { ThemeProvider } from "../../context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { MobileAvatarSheetProvider } from "@/context/MobileAvatarSheetContext";
import { ChatProvider } from "@/context/ChatContext";
import CornerToast from "@/components/common/CornerToast";
import SocketBridge from "@/components/layout/SocketBridge";
import LayoutClient from "./layoutClient";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const siteUrl = process.env.NEXT_PUBLIC_API_BASE ?? "https://toeicprep.com.vn";
const ogImage = `${siteUrl}/bannerTOEICPREP.png`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title.default"),
      template: t("title.template"),
    },
    description: t("description"),
    openGraph: {
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      url: siteUrl,
      siteName: t("siteName"),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
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
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";
  const messages = await getMessages({ locale });

  return (
    <ThemeProvider defaultTheme={theme}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <MobileAvatarSheetProvider>
            <ChatProvider>
              <LayoutClient>{children}</LayoutClient>
            </ChatProvider>
          </MobileAvatarSheetProvider>
        </AuthProvider>
      </NextIntlClientProvider>
      <CornerToast />
      <SocketBridge />
    </ThemeProvider>
  );
}
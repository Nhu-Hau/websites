// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
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
const ogImage = `${siteUrl}/images/bannerTOEICPREP.png`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ToeicPrep - Luyện thi TOEIC Online",
    template: "%s | ToeicPrep",
  },
  description: "Nền tảng luyện thi TOEIC thông minh với lộ trình cá nhân hóa.",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "ToeicPrep",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "ToeicPrep Banner",
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
  const messages = await getMessages();

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
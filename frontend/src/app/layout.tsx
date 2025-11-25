/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/app/layout.tsx
// @ts-ignore
import "./globals.css";
import "@livekit/components-styles";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Mulish } from "next/font/google";
import { SITE_CONFIG, generateMetadata as genMeta } from "@/lib/seo";
import { generateWebSiteSchema, renderJsonLd } from "@/lib/seo/structured-data";
import { routing } from "@/routing";

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mulish",
});

const baseMetadata = genMeta({
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  keywords: [
    "TOEIC",
    "luyện thi TOEIC",
    "thi thử TOEIC",
    "học TOEIC online",
    "từ vựng TOEIC",
    "luyện nghe TOEIC",
    "đọc hiểu TOEIC",
    "TOEIC practice",
    "TOEIC test",
    "TOEIC preparation",
  ],
  canonical: SITE_CONFIG.url,
  ogType: "website",
  ogImage: SITE_CONFIG.ogImage, // Ensure default OG image is set
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  ...baseMetadata,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    ...(baseMetadata.openGraph ?? {}),
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    ...(baseMetadata.twitter ?? {}),
    card: "summary_large_image",
    images: [SITE_CONFIG.ogImage],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = headers();
  const locale =
    requestHeaders.get("x-intl-locale") ??
    requestHeaders.get("x-locale") ??
    routing.defaultLocale;
  const websiteSchema = generateWebSiteSchema(SITE_CONFIG.url);

  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={`${mulish.variable} font-sans`}>
        {renderJsonLd(websiteSchema)}
        {children}
      </body>
    </html>
  );
}

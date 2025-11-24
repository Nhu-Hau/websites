/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/app/layout.tsx
// @ts-ignore
import "./globals.css";
import "@livekit/components-styles";
import { Mulish } from "next/font/google";
import { SITE_CONFIG, generateMetadata as genMeta } from "@/lib/seo";
import { generateWebSiteSchema, renderJsonLd } from "@/lib/seo/structured-data";

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mulish",
});

const metadata = genMeta({
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

export { metadata };

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
  const websiteSchema = generateWebSiteSchema(SITE_CONFIG.url);

  return (
    <html suppressHydrationWarning lang="vi">
      <body className={`${mulish.variable} font-sans`}>
        {renderJsonLd(websiteSchema)}
        {children}
      </body>
    </html>
  );
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/app/layout.tsx
// @ts-ignore
import "./globals.css";
import "@livekit/components-styles";
import { SITE_CONFIG, generateMetadata as genMeta } from "@/lib/seo";
import { generateWebSiteSchema, renderJsonLd } from "@/lib/seo/structured-data";

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
      <body>
        {renderJsonLd(websiteSchema)}
        {children}
      </body>
    </html>
  );
}

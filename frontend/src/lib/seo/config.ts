/**
 * SEO Configuration System
 * Centralized SEO metadata, structured data, and optimization utilities
 */

/**
 * Get base URL from environment variables with fallback
 * Priority: NEXT_PUBLIC_APP_URL > NEXT_PUBLIC_SITE_URL > production default > localhost (dev)
 * This function is used for server-side metadata generation
 */
function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production" ? "https://toeicprep.vn" : "http://localhost:3000")
  );
}

export const SITE_CONFIG = {
  name: "TOEICPREP",
  description: "Luyện thi TOEIC trực tuyến, thi thử đề thật, chấm điểm nhanh, giải thích chi tiết. Học từ vựng, luyện nghe, đọc hiểu TOEIC hiệu quả.",
  // Base URL is computed dynamically to support different environments
  get url() {
    return getBaseUrl();
  },
  ogImage: "/images/bannerTOEICPREP.png",
  twitterHandle: "@toeicprep",
  locale: "vi_VN",
  alternateLocales: ["en_US"],
} as const;

export type PageMetadata = {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogType?: "website" | "article" | "course" | "profile";
  ogImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
};

/**
 * Generate full page title with site name
 */
export function generateTitle(pageTitle: string, includeSiteName = true): string {
  if (!includeSiteName) return pageTitle;
  return `${pageTitle} | ${SITE_CONFIG.name}`;
}

/**
 * Generate canonical URL
 */
export function generateCanonical(path: string, locale?: string): string {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const localePrefix = locale && locale !== "vi" ? `/${locale}` : "";
  return `${baseUrl}${localePrefix}${cleanPath}`;
}

/**
 * Generate hreflang tags for multi-language support
 */
export function generateHreflang(path: string): Array<{ hreflang: string; href: string }> {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return [
    { hreflang: "vi", href: `${baseUrl}${cleanPath}` },
    { hreflang: "en", href: `${baseUrl}/en${cleanPath}` },
    { hreflang: "x-default", href: `${baseUrl}${cleanPath}` },
  ];
}

/**
 * Get absolute URL for image
 * Ensures the image URL is absolute for proper sharing on social platforms
 */
function getAbsoluteImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate Open Graph metadata
 * Returns format compatible with Next.js App Router metadata API
 */
export function generateOpenGraph(metadata: PageMetadata, locale = "vi"): {
  title: string;
  description: string;
  type: string;
  url: string;
  siteName: string;
  images: Array<{ url: string; width?: number; height?: number; alt?: string }>;
  locale: string;
} {
  const ogImage = metadata.ogImage || SITE_CONFIG.ogImage;
  const ogImageUrl = getAbsoluteImageUrl(ogImage);
  
  return {
    title: metadata.title,
    description: metadata.description,
    type: metadata.ogType || "website",
    url: metadata.canonical || SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: ogImageUrl,
        alt: metadata.title,
      },
    ],
    locale: locale === "vi" ? "vi_VN" : "en_US",
  };
}

/**
 * Generate Twitter Card metadata
 * Returns format compatible with Next.js App Router metadata API
 */
export function generateTwitterCard(metadata: PageMetadata): {
  card: "summary_large_image";
  title: string;
  description: string;
  images: string[];
  site?: string;
  creator?: string;
} {
  const ogImage = metadata.ogImage || SITE_CONFIG.ogImage;
  const ogImageUrl = getAbsoluteImageUrl(ogImage);
  
  return {
    card: "summary_large_image",
    title: metadata.title,
    description: metadata.description,
    images: [ogImageUrl],
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
  };
}

/**
 * Generate Next.js metadata object
 * Compatible with Next.js App Router metadata API (Next.js 13+)
 */
export function generateMetadata(metadata: PageMetadata, locale = "vi"): {
  title: string;
  description: string;
  keywords?: string;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  openGraph?: {
    title: string;
    description: string;
    type: string;
    url: string;
    siteName: string;
    images: Array<{ url: string; width?: number; height?: number; alt?: string }>;
    locale: string;
  };
  twitter?: {
    card: "summary_large_image";
    title: string;
    description: string;
    images: string[];
    site?: string;
    creator?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
} {
  const hreflang = generateHreflang(metadata.canonical || "");
  
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords?.join(", "),
    alternates: {
      canonical: metadata.canonical || generateCanonical("", locale),
      languages: Object.fromEntries(
        hreflang.map((h) => [h.hreflang, h.href])
      ),
    },
    openGraph: generateOpenGraph(metadata, locale),
    twitter: generateTwitterCard(metadata),
    robots: {
      index: !metadata.noindex,
      follow: !metadata.nofollow,
    },
  };
}



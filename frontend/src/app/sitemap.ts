import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url;
  const locales = ["vi", "en"];

  const routes = [
    "",
    "/dashboard",
    "/practice",
    "/vocabulary",
    "/news",
    "/community",
    "/progress",
    "/account",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale and route
  locales.forEach((locale) => {
    routes.forEach((route) => {
      const url = locale === "vi" 
        ? `${baseUrl}${route}` 
        : `${baseUrl}/${locale}${route}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.8,
      });
    });
  });

  return sitemapEntries;
}

















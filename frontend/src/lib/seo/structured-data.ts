/**
 * Structured Data (JSON-LD) Generator
 * Generates schema.org structured data for SEO
 */

import React from "react";


export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
  alternateName?: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: {
    "@type": "Person" | "Organization";
    name: string;
  };
  publisher?: {
    "@type": "Organization";
    name: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
}

export interface CourseSchema {
  "@context": "https://schema.org";
  "@type": "Course";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
  };
  courseCode?: string;
  educationalLevel?: string;
  teaches?: string[];
}

export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Generate WebSite schema
 */
export function generateWebSiteSchema(siteUrl: string, searchUrl?: string): WebSiteSchema {
  const schema: WebSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TOEIC PREP",
    url: siteUrl,
    description: "Luyện thi TOEIC trực tuyến, thi thử đề thật, chấm điểm nhanh, giải thích chi tiết.",
  };

  if (searchUrl) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchUrl,
      },
      "query-input": "required name=search_term_string",
    };
  }

  return schema;
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Article schema
 */
export function generateArticleSchema(
  headline: string,
  description: string,
  options?: {
    image?: string | string[];
    datePublished?: string;
    dateModified?: string;
    author?: { name: string; type?: "Person" | "Organization" };
    publisher?: { name: string; logo?: string };
  }
): ArticleSchema {
  const schema: ArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
  };

  if (options?.image) {
    schema.image = options.image;
  }

  if (options?.datePublished) {
    schema.datePublished = options.datePublished;
  }

  if (options?.dateModified) {
    schema.dateModified = options.dateModified;
  }

  if (options?.author) {
    schema.author = {
      "@type": options.author.type || "Person",
      name: options.author.name,
    };
  }

  if (options?.publisher) {
    schema.publisher = {
      "@type": "Organization",
      name: options.publisher.name,
    };

    if (options.publisher.logo) {
      schema.publisher.logo = {
        "@type": "ImageObject",
        url: options.publisher.logo,
      };
    }
  }

  return schema;
}

/**
 * Generate Course schema
 */
export function generateCourseSchema(
  name: string,
  description: string,
  options?: {
    courseCode?: string;
    educationalLevel?: string;
    teaches?: string[];
  }
): CourseSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: "TOEIC PREP",
    },
    courseCode: options?.courseCode,
    educationalLevel: options?.educationalLevel || "Intermediate",
    teaches: options?.teaches || ["TOEIC", "English", "Test Preparation"],
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQPageSchema(
  faqs: Array<{ question: string; answer: string }>
): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(
  name: string,
  url: string,
  options?: {
    logo?: string;
    description?: string;
    sameAs?: string[];
  }
): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: options?.logo,
    description: options?.description,
    sameAs: options?.sameAs,
  };
}

/**
 * Render JSON-LD schema as a React script element
 */
export function renderJsonLd(schema: object): React.ReactElement {
  return React.createElement(
    'script',
    {
      type: 'application/ld+json',
      dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
    },
  );
}







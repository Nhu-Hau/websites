import { routing } from "@/routing";

const ABSOLUTE_URL = /^(?:[a-z]+:)?\/\//i;
const { locales } = routing;

export function resolveLocaleHref(
  rawHref: string | undefined | null,
  basePrefix: string
) {
  if (!rawHref) return undefined;
  if (
    ABSOLUTE_URL.test(rawHref) ||
    rawHref.startsWith("mailto:") ||
    rawHref.startsWith("tel:")
  ) {
    return rawHref;
  }
  if (rawHref.startsWith("#")) return rawHref;

  const normalizedBase = basePrefix || "";
  const [pathPart, hashPart] = rawHref.split("#");
  const hash = hashPart ? `#${hashPart}` : "";
  const path = pathPart || "";

  if (!path.startsWith("/")) {
    return `${path}${hash}`;
  }

  if (path === "/") {
    return `${normalizedBase || "/"}${hash}`;
  }

  const baseNoTrailing = normalizedBase.endsWith("/")
    ? normalizedBase.slice(0, -1)
    : normalizedBase;

  const segments = path.split("/").filter(Boolean);
  const firstSegment = segments[0];
  if (
    firstSegment &&
    locales.includes(firstSegment as (typeof locales)[number])
  ) {
    return `${path}${hash}`;
  }

  if (!baseNoTrailing) {
    return `${path}${hash}`;
  }

  return `${baseNoTrailing}${path}${hash}`;
}


// i18n/request.ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./src/routing";
import * as fs from "fs";
import * as path from "path";

type MessagesObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is MessagesObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(
  target: MessagesObject,
  source: MessagesObject
): MessagesObject {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value)) {
      const existing = target[key];
      target[key] = deepMerge(
        isPlainObject(existing) ? { ...existing } : {},
        value
      );
    } else {
      target[key] = value;
    }
  }
  return target;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const loadMessages = (loc: string) => {
    try {
      const filePath = path.join(
        process.cwd(),
        "src",
        "messages",
        `${loc}.json`
      );
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      console.error(`Error loading messages for ${loc}:`, error);
      return {};
    }
  };

  const baseMessages = loadMessages("en");

  if (locale === "en") {
    return {
      locale,
      messages: baseMessages,
    };
  }

  const localeMessages = loadMessages(locale);
  const mergedMessages = deepMerge(
    JSON.parse(JSON.stringify(baseMessages)) as MessagesObject,
    localeMessages
  );

  return {
    locale,
    messages: mergedMessages,
  };
});

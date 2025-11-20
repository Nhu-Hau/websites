"use client";

import { Github, Twitter, Youtube, Instagram, Globe } from "lucide-react";
import Link from "next/link";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const FOOTER_COPY = {
  brandDescription:
    "Luyện thi TOEIC trực tuyến. Mô phỏng bài thi thật. Phân tích lỗi sai. Theo dõi tiến độ bằng biểu đồ.",
  resources: "Tài nguyên",
  practice: "Luyện đề",
  vocabulary: "Từ vựng",
  forum: "Diễn đàn",
  support: "Hỗ trợ",
  helpCenter: "Trung tâm trợ giúp",
  contact: "Liên hệ",
  faq: "FAQ",
  language: "Ngôn ngữ",
  vietnamese: "Tiếng Việt",
  english: "English",
  terms: "Điều khoản",
  privacy: "Chính sách bảo mật",
  rights: (year: number) => `Bản quyền ${year} ToeicPrep. Giữ toàn quyền.`,
};

export default function Footer() {
  const year = new Date().getFullYear();

  // dùng hook bạn cung cấp
  const { locale, hrefFor, switchLocale } = useLocaleSwitch();
  const basePrefix = useBasePrefix();

  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-3 md:col-span-3 lg:col-span-2">
            <Link href={`${basePrefix}/home`}>
              <div className="text-xl xl:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 -tracking-tighter">
                Toeic
                <span className="text-sky-700">Prep</span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
              {FOOTER_COPY.brandDescription}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={18} />
              </a>
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={18} />
              </a>
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube size={18} />
              </a>
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold">{FOOTER_COPY.resources}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={`${basePrefix}/practice`}
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {FOOTER_COPY.practice}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePrefix}/vocabulary`}
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {FOOTER_COPY.vocabulary}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePrefix}/community`}
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {FOOTER_COPY.forum}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{FOOTER_COPY.support}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={`${basePrefix}/help-center`}
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {FOOTER_COPY.helpCenter}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePrefix}/contact`}
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {FOOTER_COPY.contact}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePrefix}/faq`}
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {FOOTER_COPY.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Language (dùng useLocaleSwitch) */}
          <div>
            <h3 className="text-sm font-semibold">{FOOTER_COPY.language}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={hrefFor("vi")}
                  className="inline-flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400"
                  aria-current={locale === "vi" ? "true" : undefined}
                  onClick={(e) => {
                    // tuỳ chọn: chuyển bằng router.replace để không scroll
                    e.preventDefault();
                    switchLocale("vi");
                  }}
                >
                  <Globe size={14} /> {FOOTER_COPY.vietnamese}
                </Link>
              </li>
              <li>
                <Link
                  href={hrefFor("en")}
                  className="inline-flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400"
                  aria-current={locale === "en" ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    switchLocale("en");
                  }}
                >
                  <Globe size={14} /> {FOOTER_COPY.english}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex sm:items-center sm:justify-between">
          <p>{FOOTER_COPY.rights(year)}</p>
          <div className="mt-4 sm:mt-0">
            <Link
              href={`${basePrefix}/terms`}
              className="hover:text-sky-500 dark:hover:text-sky-400"
            >
              {FOOTER_COPY.terms}
            </Link>{" "}
            ·{" "}
            <Link
              href={`${basePrefix}/privacy`}
              className="hover:text-sky-500 dark:hover:text-sky-400"
            >
              {FOOTER_COPY.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

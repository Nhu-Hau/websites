"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";
import { useTranslations } from "next-intl";

const Banner = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const t = useTranslations("banner");

  return (
    <section
      className="relative w-full min-h-[500px] lg:min-h-[600px] 2xl:min-h-[700px] overflow-hidden transition-colors duration-500 bg-[#AEC2D4] dark:bg-gray-600"
      aria-labelledby="banner-heading"
    >
      {/* decorative gradient layers */}
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full blur-3xl bg-white/40 dark:bg-white/10" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl bg-cyan-200/60 dark:bg-cyan-300/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-screen-xl 2xl:max-w-screen-2xl">
        <div className="flex flex-col items-center justify-between gap-8 px-6 sm:px-8 xl:px-6 2xl:px-16 py-20 md:py-24 2xl:py-32 lg:flex-row">
          {/* Left: Text section */}
          <div className="w-full lg:w-1/2 rounded-2xl bg-white/70 p-6 md:p-10 2xl:p-14 shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:bg-gray-800/60 dark:ring-white/10 transition-colors">
            <h1
              id="banner-heading"
              className="text-2xl md:text-4xl 2xl:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white"
            >
              <span className="block mb-2 md:mb-3">{t("title1")}</span>
              <span className="block">{t("title2")}</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              <span>{t("descriptionLine1")}</span>
              <br />
              <span>{t("descriptionLine2")}</span>
            </p>

            <div className="mt-6 md:mt-8">
              <Link
                href="/testList"
                prefetch
                aria-label={t("buttonText")}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 2xl:px-8 2xl:py-4 text-sm sm:text-base md:text-lg font-semibold text-gray-900 shadow-md bg-white hover:bg-gray-100 active:bg-gray-200 dark:text-gray-900 dark:bg-gray-100 dark:hover:bg-gray-300 transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40 hover:scale-[1.03]"
              >
                {t("buttonText")}
              </Link>
            </div>
          </div>

          {/* Right: Image section */}
          <div className="relative w-full lg:w-1/2 h-64 md:h-80 lg:h-[500px] 2xl:h-[600px]">
            <Image
              src={isDarkMode ? "/images/darkbanner.png" : "/images/banner.png"}
              alt={t.has?.("imageAlt") ? t("imageAlt") : "Illustration"}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain drop-shadow-lg select-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;

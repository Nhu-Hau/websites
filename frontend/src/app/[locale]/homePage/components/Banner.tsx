"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";
import { useTranslations } from "next-intl";

const Banner = () => {
  const { theme } = useTheme(); // lấy theme từ context
  const isDarkMode = theme === "dark";

  const t = useTranslations("banner"); // Lấy namespace banner trong JSON

  return (
    <div className="relative w-full min-h-[500px] lg:min-h-[600px] 2xl:min-h-[700px] bg-[#AEC2D4] dark:bg-gray-500 overflow-hidden transition-colors duration-500">
      <div className="relative z-10 max-w-screen-xl 2xl:max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 px-8 sm:px-8 xl:px-6 2xl:px-16 py-24 2xl:py-32">
        {/* Left: Text section */}
        <div className="w-full lg:w-1/2 space-y-6 2xl:space-y-10 bg-white/60 dark:bg-gray-800/60 p-6 md:p-10 2xl:p-14 rounded-2xl shadow-xl backdrop-blur-sm transition duration-500">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-4xl 2xl:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            <span className="block mb-3">{t("title1")}</span>
            <span>{t("title2")}</span>
          </h1>

          <div className="text-sm xs:text-base md:text-lg 2xl:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
            <span>{t("descriptionLine1")}</span>
            <br />
            <span>{t("descriptionLine2")}</span>
          </div>

          <button className="lg-py-0 xl:py-4 2xl:py-0">
            <Link
              href="/testList"
              className="px-6 py-3 2xl:px-8 2xl:py-4 bg-white dark:bg-gray-100 text-black dark:text-gray-900 rounded-xl font-semibold shadow-md hover:bg-gray-100 dark:hover:bg-gray-300 transition duration-300 hover:scale-105 text-base 2xl:text-lg"
            >
              {t("buttonText")}
            </Link>
          </button>
        </div>

        {/* Right: Image section */}
        <div className="relative w-full lg:w-1/2 h-64 md:h-80 lg:h-[500px] 2xl:h-[600px]">
          <Image
            src={isDarkMode ? "/images/darkBanner.png" : "/images/banner.png"}
            alt="Illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;
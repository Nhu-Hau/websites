/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTranslations } from "next-intl";
import {
  FaClock,
  FaCheckCircle,
  FaBookOpen,
  FaChartLine,
} from "react-icons/fa";

const icons = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: any) => <FaClock {...props} />,
  (props: any) => <FaCheckCircle {...props} />,
  (props: any) => <FaBookOpen {...props} />,
  (props: any) => <FaChartLine {...props} />,
];

export default function BenefitsSection() {
  const t = useTranslations("benefits");

  const title = t("title");
  const subtitle = t("subtitle");

  // Lấy từng item một cách thủ công
  const items = [0, 1, 2, 3].map((index) => ({
    title: t(`items.${index}.title`),
    description: t(`items.${index}.description`),
  }));

  return (
    <section className="py-20 2xl:py-28 bg-white dark:bg-zinc-900">
      <div className="text-center mb-12 px-3 sm:px-3 md:px-0 2xl:px-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black dark:text-white uppercase tracking-tight">
          {title}
        </h1>
        <p className="text-sm sm:text-base md:text-lg font-light mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 2xl:px-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((benefit, index) => {
          const Icon = icons[index];
          return (
            <div
              key={index}
              className="group p-6 2xl:p-8 bg-gray-100 dark:bg-gray-800 rounded-2xl transition-all duration-300 hover:bg-[#35509A] dark:hover:bg-sky-800 shadow-md"
            >
              <div className="flex items-center gap-4 mb-4">
                <Icon className="text-[#35509A] dark:text-sky-400 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
              </div>
              <h3 className="text-md sm:text-lg 2xl:text-xl font-semibold text-black dark:text-white group-hover:text-white">
                {benefit.title}
              </h3>
              <p className="text-sm 2xl:text-base text-gray-700 dark:text-gray-300 group-hover:text-white mt-2">
                {benefit.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

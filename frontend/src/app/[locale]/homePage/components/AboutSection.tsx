/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  FaBullseye,
  FaUserGraduate,
  FaLightbulb,
  FaGlobeAsia,
} from "react-icons/fa";

const icons = [
  (props: any) => <FaBullseye {...props} />,
  (props: any) => <FaUserGraduate {...props} />,
  (props: any) => <FaLightbulb {...props} />,
  (props: any) => <FaGlobeAsia {...props} />,
];

export default function AboutSection() {
  const t = useTranslations("about");

  const missionLabel = t("missionLabel");
  const missionTitle = t("missionTitle");
  const missionDescription = t("missionDescription");

  const coreValuesLabel = t("coreValuesLabel");
  const coreValuesTitle = t("coreValuesTitle");
  const coreValuesSubtitle = t("coreValuesSubtitle");

  // Lấy từng core value item thủ công
  const values = [0, 1, 2, 3].map((index) => ({
    title: t(`values.${index}.title`),
    description: t(`values.${index}.description`),
  }));

  return (
    <>
      {/* Phần Sứ Mệnh */}
      <section className="bg-gray-100 dark:bg-gray-700 py-10 2xl:py-20">
        <div className="container mx-auto flex flex-col-reverse md:flex-row items-center max-w-screen-xl 2xl:max-w-screen-2xl px-4 2xl:px-10 gap-8 2xl:gap-11">
          <div className="md:w-1/2 p-6 2xl:p-10">
            <Image
              src="/images/aboutsection.png"
              alt={missionTitle}
              width={500}
              height={400}
              className="mx-auto sm:mx-0 h-auto w-auto shadow-md rounded-[50%_50%_40%_60%/50%_40%_60%_50%]"
              priority
            />
          </div>
          <div className="md:w-1/2 p-6 2xl:p-10">
            <span className="text-sm text-gray-500 dark:text-gray-300 uppercase tracking-wider font-medium border-b-2 border-black dark:border-white inline-block mb-4">
              {missionLabel}
            </span>
            <h2 className="text-xl sm:text-4xl 2xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight 2xl:leading-tight">
              {missionTitle}
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-lg text-justify">
              {missionDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Phần Giá Trị Cốt Lõi */}
      <section className="bg-white dark:bg-zinc-900">
        <div className="container px-5 2xl:px-10 py-12 2xl:py-20 mx-auto">
          <div className="text-center">
            <h2 className="mb-4 bg-[#35509A] text-white px-4 py-2 rounded-full inline-block text-xs 2xl:text-sm font-semibold uppercase tracking-widest dark:bg-sky-600 dark:text-white">
              {coreValuesLabel}
            </h2>
            <p className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl uppercase">
              {coreValuesTitle}
            </p>
            <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-center">
              {coreValuesSubtitle}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 2xl:gap-12 max-w-5xl 2xl:max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = icons[index];
              return (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 2xl:h-14 2xl:w-14 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-[#35509A] dark:group-hover:bg-sky-600 transition-all duration-300">
                      <Icon className="text-[#35509A] dark:text-blue-300 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg 2xl:text-xl font-semibold text-gray-800 dark:text-white group-hover:text-[#35509A] dark:group-hover:text-sky-600 cursor-pointer">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm 2xl:text-base text-gray-900 dark:text-gray-400">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

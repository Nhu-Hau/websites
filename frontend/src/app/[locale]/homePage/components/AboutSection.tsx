"use client";

import Image from "next/image";
import {
  FaBullseye,
  FaUserGraduate,
  FaLightbulb,
  FaGlobeAsia,
} from "react-icons/fa";

const coreValues = [
  {
    title: "Mission-Oriented",
    description:
      "We are driven to help students improve their TOEIC scores through effective and flexible practice.",
    icon: (
      <FaBullseye className="text-[#35509A] dark:text-blue-300 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
  {
    title: "Student-Centered",
    description:
      "Our platform is designed to meet the needs of busy learners preparing for the TOEIC exam.",
    icon: (
      <FaUserGraduate className="text-[#35509A] dark:text-blue-300 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
  {
    title: "Smart & Practical",
    description:
      "We focus on realistic test formats, instant feedback, and progress tracking to boost performance.",
    icon: (
      <FaLightbulb className="text-[#35509A] dark:text-blue-300 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
  {
    title: "Global Vision",
    description:
      "We aim to support learners worldwide in achieving their English certification goals.",
    icon: (
      <FaGlobeAsia className="text-[#35509A] dark:text-blue-300 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
];

export default function AboutSection() {
  return (
    <>
      {/* Mission Section */}
      <section className="bg-gray-100 dark:bg-gray-700 py-10 2xl:py-20">
        <div className="container mx-auto flex flex-col-reverse sm:flex-row items-center max-w-screen-xl 2xl:max-w-screen-2xl px-4 2xl:px-10 gap-8 2xl:gap-11">
          <div className="sm:w-1/2 p-6 2xl:p-10">
            <Image
              src="/images/aboutsection.png"
              alt="TOEIC mission illustration"
              width={500}
              height={400}
              className="mx-auto sm:mx-0 h-auto w-auto shadow-md rounded-[50%_50%_40%_60%/50%_40%_60%_50%]"
              priority
            />
          </div>
          <div className="sm:w-1/2 p-6 2xl:p-10">
            <span className="text-sm text-gray-500 dark:text-gray-300 uppercase tracking-wider font-medium border-b-2 border-black dark:border-white inline-block mb-4">
              Our Mission
            </span>
            <h2 className="text-xl sm:text-4xl 2xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight 2xl:leading-tight">
              A Smarter Way to Prepare for the TOEIC
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-base 2xl:text-lg leading-relaxed max-w-lg">
              We created this platform to help English learners practice for the
              TOEIC exam more effectively. Whether you are a student, a job
              seeker, or a professional, we aim to provide tools that make your
              test preparation smarter, faster, and more motivating.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-white dark:bg-gray-900">
        <div className="container px-5 2xl:px-10 py-12 2xl:py-20 mx-auto">
          <div className="text-center">
            <h2 className="mb-4 bg-[#35509A] text-white px-4 py-2 rounded-full inline-block text-xs 2xl:text-sm font-semibold uppercase tracking-widest dark:bg-blue-500 dark:text-white">
              Our Core Values
            </h2>
            <p className="mt-2 text-xl 2xl:text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl uppercase">
              What We Stand For
            </p>
            <p className="mt-4 text-lg 2xl:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-justify">
              Everything we build is centered around our commitment to helping
              TOEIC learners succeed – with focus, flexibility, and real-world
              effectiveness.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 2xl:gap-12 max-w-5xl 2xl:max-w-6xl mx-auto">
            {coreValues.map((value, index) => (
              <div key={index} className="flex items-start gap-4 group">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 2xl:h-14 2xl:w-14 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-500 transition-all duration-300">
                    {value.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg 2xl:text-xl font-semibold text-gray-800 dark:text-white group-hover:text-blue-500 cursor-pointer">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm 2xl:text-base text-gray-900 dark:text-gray-400">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

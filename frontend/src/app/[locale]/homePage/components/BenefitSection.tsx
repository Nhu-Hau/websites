"use client";

import {
  FaClock,
  FaCheckCircle,
  FaBookOpen,
  FaChartLine,
} from "react-icons/fa";

const benefits = [
  {
    title: "Real TOEIC Exam Experience",
    description:
      "Prepare with authentic TOEIC-style questions that mirror the format, difficulty, and timing of the actual exam. Our smart test engine ensures you're always practicing with the most up-to-date question styles aligned with the latest TOEIC standards.",
    icon: (
      <FaClock className="text-[#35509A] dark:text-blue-500 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
  {
    title: "Instant, Accurate Scoring",
    description:
      "Receive your results instantly after each test. Our advanced grading system mimics real TOEIC scoring criteria so you can measure your progress accurately—no more guessing or waiting.",
    icon: (
      <FaCheckCircle className="text-[#35509A] dark:text-blue-500 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
  {
    title: "Step-by-Step Answer Explanations",
    description:
      "Every question includes a detailed explanation to help you understand why an answer is correct—and why others are not. Learn strategies, grammar tips, and vocabulary insights as you review your mistakes.",
    icon: (
      <FaBookOpen className="text-[#35509A] dark:text-blue-500 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
  {
    title: "Personal Progress Dashboard",
    description:
      "Easily track your learning journey with an interactive dashboard. View your test history, see how your scores evolve over time, and identify your strengths and areas to improve—perfect for staying motivated and focused.",
    icon: (
      <FaChartLine className="text-[#35509A]  dark:text-blue-500 group-hover:text-white w-6 h-6 2xl:w-8 2xl:h-8" />
    ),
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-20 2xl:py-28 bg-white dark:bg-gray-900">
      <div className="text-center mb-12 px-3 sm:px-3 md:px-0 2xl:px-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-black dark:text-white uppercase tracking-tight">
          Why Practice with{" "}
          <span className="text-[#35509A] dark:text-blue-500">Our TOEIC Website?</span>
        </h1>
        <p className="text-base md:text-lg 2xl:text-xl font-light mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Improve your TOEIC Listening & Reading skills effectively with
          realistic tests and smart features.
        </p>
      </div>

      <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 2xl:px-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="group p-6 2xl:p-8 bg-gray-100 dark:bg-gray-800 rounded-2xl transition-all duration-300 hover:bg-[#35509A] dark:hover:bg-blue-900 shadow-md"
          >
            <div className="flex items-center gap-4 mb-4">{benefit.icon}</div>
            <h3 className="text-md sm:text-lg 2xl:text-xl font-semibold text-black dark:text-white group-hover:text-white">
              {benefit.title}
            </h3>
            <p className="text-sm 2xl:text-base text-gray-700 dark:text-gray-300 group-hover:text-white mt-2">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;

import {
  ClipboardList,
  Rocket,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface TestCardProps {
  test: {
    title: string;
    description: string;
    duration: string;
    questions: number;
    completed?: boolean;
    score?: number;
    completedAt?: string;
  };
}

const TestCard = ({ test }: TestCardProps) => {
  const {
    title,
    description,
    duration,
    questions,
    completed,
    score,
    completedAt,
  } = test;

  return (
    <div className="relative w-[300px] bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden border border-black dark:border-gray-700 flex flex-col hover:shadow-xl transition-shadow duration-200 mx-auto">
      {/* Dấu tích xanh nếu đã hoàn thành */}
      {completed && (
        <div className="absolute top-4 right-4">
          <div title="Completed">
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg sm:text-xl text-black dark:text-white flex items-center gap-2 mb-1">
          <ClipboardList size={20} className="text-[#334e99] dark:text-teal-300" />
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
          {description}
        </p>

        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-[#334e99] dark:text-teal-300 mb-2">
          <span className="flex items-center gap-1 bg-[#EFF8FF] dark:bg-gray-700 px-2 py-1 rounded-lg">
            <FileText size={14} /> {questions} Questions
          </span>

          <span className="flex items-center gap-1 bg-[#EFF8FF] dark:bg-gray-700 px-2 py-1 rounded-lg">
            <Rocket size={14} /> {duration}
          </span>

          {completed && score && (
            <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg font-semibold">
              Score: {score}
            </span>
          )}

          {completed && completedAt && (
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-lg">
              {completedAt}
            </span>
          )}
        </div>

        {/* Button */}
        <button
          className={`mt-auto w-full font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-150
            ${
              completed
                ? "border-[#39ee84] border hover:bg-[#31b86a] dark:text-white text-[#31b86a] hover:text-white"
                : "dark:border-blue-500 border-tealCustom border bg-white dark:bg-transparent hover:bg-tealCustom dark:hover:bg-blue-900 text-tealCustom dark:text-white hover:text-white "
            }
          `}
        >
          {completed ? "View Result" : "Start Test"}
        </button>
      </div>
    </div>
  );
};

export default TestCard;

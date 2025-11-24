"use client";

import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export function PremiumGuard() {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  return (
    <div className="fixed inset-0 z-[9999] hidden safe-area-inset" id="premium-guard-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-3 xs:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl xs:rounded-3xl shadow-2xl max-w-md w-full p-4 xs:p-6 space-y-3 xs:space-y-4 max-h-[calc(100vh-2rem)] xs:max-h-[90vh] overflow-y-auto">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl xs:text-3xl">
              💎
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl xs:text-2xl font-bold text-center text-gray-900 dark:text-white">
            Premium Feature
          </h3>

          {/* Description */}
          <p className="text-center text-xs xs:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Chức năng dịch và luyện từ vựng chỉ dành cho tài khoản Premium. 
            Nâng cấp ngay để:
          </p>

          {/* Features */}
          <ul className="space-y-1.5 xs:space-y-2 text-xs xs:text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
              <span className="leading-relaxed">Dịch từ và cụm từ tức thì</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
              <span className="leading-relaxed">Phát âm tiếng Anh chuẩn</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
              <span className="leading-relaxed">Lưu từ vựng vào bộ từ cá nhân</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
              <span className="leading-relaxed">Gợi ý từ vựng quan trọng</span>
            </li>
          </ul>

          {/* Actions */}
          <div className="flex gap-2 xs:gap-3 pt-1">
            <button
              onClick={() => {
                document.getElementById("premium-guard-modal")?.classList.add("hidden");
              }}
              className="flex-1 px-3 xs:px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 touch-manipulation"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                router.push(`${basePrefix}/account`);
              }}
              className="flex-1 px-3 xs:px-4 py-2.5 bg-gradient-to-br from-[#4063bb] to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-[#4063bb]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#4063bb]/40 active:scale-95 touch-manipulation"
            >
              Nâng cấp Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to show premium guard
export function showPremiumGuard() {
  if (typeof window !== "undefined") {
    document.getElementById("premium-guard-modal")?.classList.remove("hidden");
  }
}



"use client";

import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export function PremiumGuard() {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  return (
    <div className="fixed inset-0 z-[9999] hidden" id="premium-guard-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl">
              💎
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Premium Feature
          </h3>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-gray-400">
            Chức năng dịch và luyện từ vựng chỉ dành cho tài khoản Premium. 
            Nâng cấp ngay để:
          </p>

          {/* Features */}
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span>Dịch từ và cụm từ tức thì</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span>Phát âm tiếng Anh chuẩn</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span>Lưu từ vựng vào bộ từ cá nhân</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span>Gợi ý từ vựng quan trọng</span>
            </li>
          </ul>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                document.getElementById("premium-guard-modal")?.classList.add("hidden");
              }}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                router.push(`${basePrefix}/account`);
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-colors"
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




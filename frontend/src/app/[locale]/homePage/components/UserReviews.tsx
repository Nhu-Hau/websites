"use client";
import React from "react";
import "remixicon/fonts/remixicon.css";

const reviews = [
  {
    stars: 5,
    text: `"Trang luyện thi TOEIC này thực sự rất hữu ích! Giao diện đơn giản, dễ dùng, giúp tôi cải thiện kỹ năng Nghe nhanh chóng."`,
    name: "Nguyễn Thảo Vy",
    role: "Sinh viên Kinh tế",
  },
  {
    stars: 4.5,
    text: `"Tôi rất thích phần luyện Đọc. Các bài thi thử rất sát với đề thật. Rất tiện lợi để học mọi lúc mọi nơi!"`,
    name: "Trần Quốc Bảo",
    role: "Người luyện TOEIC 700+",
  },
  {
    stars: 5,
    text: `"Sau khi luyện tập thường xuyên trên trang này, tôi đã tăng điểm TOEIC từ 550 lên 750 chỉ trong 2 tháng!"`,
    name: "Lê Minh Tuấn",
    role: "Nhân viên văn phòng",
  },
];

const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  return (
    <>
      {[...Array(fullStars)].map((_, i) => (
        <i key={i} className="ri-star-fill" />
      ))}
      {halfStar && <i className="ri-star-half-fill" />}
    </>
  );
};

export default function UserReviews() {
  return (
    <section className="py-16 2xl:py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 2xl:px-10">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white leading-snug 2xl:leading-tight">
          Người dùng nói gì về TOEIC PREP
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 2xl:gap-10">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white p-6 2xl:p-8 rounded-lg shadow-sm dark:bg-gray-700 flex flex-col h-full"
            >
              <div className="flex text-amber-400 mb-4 text-xl 2xl:text-2xl">
                {renderStars(review.stars)}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-6 text-sm 2xl:text-base leading-relaxed">
                {review.text}
              </div>

              <div className="flex items-center mt-auto pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 mr-4">
                  <i className="ri-user-3-line text-xl 2xl:text-2xl" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-base 2xl:text-lg">
                    {review.name}
                  </h4>
                  <p className="text-sm 2xl:text-base text-gray-500 dark:text-gray-400">
                    {review.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

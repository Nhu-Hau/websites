/**
 * So sánh điểm placement test với điểm user khai báo
 */
export function comparePlacementWithSelfReported(
  reportedScore: number | null,
  placementScore: number | null
): {
  level: "match" | "medium_diff" | "large_diff";
  diff: number;
  absDiff: number;
  message: string;
  subtitle: string;
} | null {
  if (reportedScore === null || placementScore === null) {
    return null;
  }

  const diff = placementScore - reportedScore;
  const absDiff = Math.abs(diff);

  if (absDiff <= 75) {
    return {
      level: "match",
      diff,
      absDiff,
      message: "Điểm placement test khá gần với điểm TOEIC bạn khai báo.",
      subtitle: `Bạn khai báo ${reportedScore} điểm, placement test cho kết quả ${placementScore} điểm (chênh lệch ${absDiff} điểm). Điều này cho thấy kết quả placement test khá chính xác.`,
    };
  } else if (absDiff <= 150) {
    return {
      level: "medium_diff",
      diff,
      absDiff,
      message: "Điểm placement test hơi lệch so với điểm TOEIC bạn khai báo.",
      subtitle: `Bạn khai báo ${reportedScore} điểm, placement test cho kết quả ${placementScore} điểm (chênh lệch ${absDiff} điểm). Sự khác biệt này có thể do thời gian làm bài, độ chính xác ước tính, hoặc thay đổi trình độ từ lần thi trước.`,
    };
  } else {
    return {
      level: "large_diff",
      diff,
      absDiff,
      message: "Điểm placement test lệch khá nhiều so với điểm TOEIC bạn khai báo.",
      subtitle: `Bạn khai báo ${reportedScore} điểm, placement test cho kết quả ${placementScore} điểm (chênh lệch ${absDiff} điểm). Sự khác biệt lớn này có thể do sai số lớn, người dùng không tập trung khi làm bài, hoặc trình độ đã thay đổi đáng kể. Hãy làm progress test sau 5 ngày để đánh giá lại.`,
    };
  }
}


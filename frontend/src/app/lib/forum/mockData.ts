import type { Post, Comment } from "./types";

// Simple helper for date formatting
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const mockPosts: Post[] = [
  {
    id: "p-1001",
    title: "Chào mừng đến với Community Forum",
    content:
      "Đây là bài viết mẫu để bạn bắt đầu. Hãy chia sẻ câu hỏi, kinh nghiệm và mẹo của bạn tại đây!\n\nTailwind, Next.js, và TypeScript kết hợp để tạo nên trải nghiệm mượt mà.",
    author: "Admin",
    createdAt: daysAgo(1),
    excerpt: "Bài viết mẫu – chia sẻ câu hỏi, kinh nghiệm và mẹo…",
  },
  {
    id: "p-1002",
    title: "Mẹo tối ưu hiệu năng Next.js",
    content:
      "Sử dụng dynamic import, memo hóa component, và tránh re-render không cần thiết. Hãy thử React Profiler để xem nơi tốn thời gian nhất.",
    author: "Linh Nguyen",
    createdAt: daysAgo(2),
    excerpt: "Dynamic import, memo hóa, React Profiler…",
  },
  {
    id: "p-1003",
    title: "Tailwind Tips: Tạo theme màu nhanh",
    content:
      "Khai báo màu trong tailwind.config.js và sử dụng gradient cho header. Dùng utility first giúp tốc độ dựng layout nhanh chóng.",
    author: "Khoa Le",
    createdAt: daysAgo(3),
    excerpt: "Khai báo màu, gradient header, utility-first…",
  },
  {
    id: "p-1004",
    title: "TypeScript: Kiểu hóa cho state phức tạp",
    content:
      "Tận dụng type alias và generics. Tránh any nếu có thể. Hãy định nghĩa rõ kiểu dữ liệu cho Context để dễ bảo trì.",
    author: "Thao Tran",
    createdAt: daysAgo(4),
    excerpt: "Type alias, generics, tránh any…",
  },
  {
    id: "p-1005",
    title: "UI/UX: Viết copy thân thiện",
    content:
      "Ngắn gọn, rõ ràng, ưu tiên hành động. Sử dụng khoảng trắng và phân cấp thị giác để dẫn dắt mắt người dùng.",
    author: "Huy Hoang",
    createdAt: daysAgo(5),
    excerpt: "Ngắn gọn, rõ ràng, phân cấp thị giác…",
  },
  {
    id: "p-1006",
    title: "Chia sẻ dự án open-source của bạn",
    content:
      "Hãy để link GitHub ở dưới phần bình luận. Mọi người có thể review và đóng góp.",
    author: "Admin",
    createdAt: daysAgo(6),
    excerpt: "Để link GitHub, nhận góp ý từ cộng đồng…",
  },
];

export const mockComments: Comment[] = [
  {
    id: "c-2001",
    postId: "p-1001",
    author: "Minh",
    content: "Tuyệt vời! Mình sẽ thử module này ngay.",
    createdAt: daysAgo(1),
  },
  {
    id: "c-2002",
    postId: "p-1002",
    author: "Ha",
    content: "Dynamic import giúp bundle nhỏ đi đáng kể.",
    createdAt: daysAgo(1),
  },
  {
    id: "c-2003",
    postId: "p-1003",
    author: "Long",
    content: "Gradient header nhìn rất hiện đại!",
    createdAt: daysAgo(2),
  },
];
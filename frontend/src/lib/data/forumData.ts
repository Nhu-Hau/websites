import type { Post, Comment } from "../../types/forumTypes";

// Simple helper for date formatting
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const mockPosts: Post[] = [
  {
    id: "p-1001",
    title: "Lịch thi TOEIC tháng 9 tại IIG",
    content:
      "Mọi người ơi, có ai biết lịch thi TOEIC tháng 9 tại IIG không? Mình đang định đăng ký mà chưa rõ ngày thi và lệ phí.",
    author: "An Nguyen",
    createdAt: daysAgo(1),
    excerpt: "Hỏi lịch thi TOEIC tháng 9 tại IIG…",
  },
  {
    id: "p-1002",
    title: "Chia sẻ mẹo luyện nghe TOEIC",
    content:
      "Mọi người có cách nào luyện nghe TOEIC hiệu quả không? Mình nghe Part 3 và 4 bị loạn thông tin quá.",
    author: "Linh Pham",
    createdAt: daysAgo(2),
    excerpt: "Mẹo luyện nghe Part 3, 4 hiệu quả…",
  },
  {
    id: "p-1003",
    title: "Hỏi bài ngữ pháp: Câu điều kiện",
    content:
      "Mình chưa rõ cách dùng câu điều kiện loại 2 và loại 3. Ai giải thích giúp mình với ví dụ dễ hiểu được không?",
    author: "Tuan Tran",
    createdAt: daysAgo(3),
    excerpt: "Giúp mình phân biệt câu điều kiện loại 2 và 3…",
  },
  {
    id: "p-1004",
    title: "Chia sẻ đề thi TOEIC mới nhất",
    content:
      "Mình vừa thi tuần trước, có vài câu khó trong Part 7. Ai muốn tham khảo thì để lại email, mình gửi file.",
    author: "Hoa Le",
    createdAt: daysAgo(4),
    excerpt: "Đề TOEIC mới nhất, chia sẻ câu khó…",
  },
  {
    id: "p-1005",
    title: "Kinh nghiệm thi TOEIC lần đầu",
    content:
      "Mình mới thi TOEIC lần đầu, được 650 điểm. Đây là vài kinh nghiệm nhỏ cho bạn nào chuẩn bị thi.",
    author: "Nam Do",
    createdAt: daysAgo(5),
    excerpt: "Kinh nghiệm thi TOEIC lần đầu…",
  },
  {
    id: "p-1006",
    title: "Tìm bạn học TOEIC chung",
    content:
      "Có ai ở HCM muốn học nhóm TOEIC không? Cùng ôn luyện để giữ động lực nhé!",
    author: "Mai Anh",
    createdAt: daysAgo(6),
    excerpt: "Tìm nhóm học TOEIC chung ở HCM…",
  },
];

export const mockComments: Comment[] = [
  {
    id: "c-2001",
    postId: "p-1001",
    author: "Minh",
    content: "Mình xem lịch trên web IIG thì tháng 9 có thi ngày 8, 15 và 29.",
    createdAt: daysAgo(1),
  },
  {
    id: "c-2002",
    postId: "p-1002",
    author: "Ha",
    content: "Bạn thử nghe podcast tiếng Anh mỗi ngày, rồi luyện shadowing nhé.",
    createdAt: daysAgo(1),
  },
  {
    id: "c-2003",
    postId: "p-1003",
    author: "Long",
    content: "Câu điều kiện loại 2: If I were you, I would study more. Loại 3: If I had studied, I would have passed.",
    createdAt: daysAgo(2),
  },
];
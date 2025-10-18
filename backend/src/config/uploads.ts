import path from "path";

/** Thư mục lưu file thực tế trên máy */
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.resolve(process.cwd(), "uploads");

/** Route public để truy cập file (ví dụ: http://localhost:4000/uploads/xxx.png) */
export const UPLOADS_ROUTE = "/uploads";
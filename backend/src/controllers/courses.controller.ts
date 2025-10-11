//backend/src/controllers/courses.controller.ts
import { Request, Response } from "express";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const BUCKET = process.env.AWS_S3_BUCKET || "project.toeic";
const COURSES_PREFIX = process.env.COURSES_PREFIX || "Khoá học TA/";
// Bật mock khi cần test UI nếu S3 rỗng
const COURSES_DEV_SEED = process.env.COURSES_DEV_SEED === "1";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

function slugify(input: string) {
  return encodeURIComponent(
    input
      .normalize("NFC")
      .replace(/\/+$/,"")
      .replace(/\s+/g," ")
  );
}

export async function listCourses(_req: Request, res: Response) {
  try {
    // Lấy “thư mục con” trực tiếp bên trong Khoá học TA/
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: COURSES_PREFIX,
      Delimiter: "/", // rất quan trọng để nhận CommonPrefixes
    });
    const out = await s3.send(cmd);

    const prefixes = out.CommonPrefixes?.map(p => p.Prefix!).filter(Boolean) || [];

    // Map ra danh sách course
    const items = prefixes
      .filter(p => p !== COURSES_PREFIX) // bỏ chính nó
      .map((p) => {
        // p dạng: Khoá học TA/<tên khóa>/
        const name = p.slice(COURSES_PREFIX.length).replace(/\/+$/,"");
        const slug = slugify(name); // dùng slug = encodeURIComponent để giữ dấu
        return {
          slug,
          title: name,
          description: `Khoá học: ${name}`,
          coverUrl: null,
          access: "premium" as const, // mặc định premium, tuỳ bạn
          totalLessons: undefined,
          totalDurationMin: undefined,
        };
      });

    if (items.length === 0 && COURSES_DEV_SEED) {
      // Fallback mock để bạn thấy UI chạy
      return res.json({
        items: [
          {
            slug: slugify("Full Khóa Xóa Mù Ngữ Pháp Cô Mai Phương"),
            title: "Full Khóa Xóa Mù Ngữ Pháp Cô Mai Phương",
            description: "Ngữ pháp nền tảng cho người mất gốc.",
            coverUrl: null,
            access: "premium",
          },
          {
            slug: slugify("40 video học tiếng anh cơ bản nhất giúp bạn hết mất gốc"),
            title: "40 video học tiếng anh cơ bản nhất giúp bạn hết mất gốc",
            description: "Lộ trình cơ bản 40 video.",
            coverUrl: null,
            access: "premium",
          },
          {
            slug: slugify("600 Từ Vựng Toeic Chinh phục mọi chủ đề trong đề thi Toeic"),
            title: "600 Từ Vựng Toeic",
            description: "Từ vựng chủ đề bám sát đề thi.",
            coverUrl: null,
            access: "premium",
          },
        ],
      });
    }

    return res.json({ items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi lấy danh sách khoá học" });
  }
}
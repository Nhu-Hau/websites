import {
  ListObjectsV2Command,
  GetObjectCommand,
  _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";

const BUCKET = process.env.AWS_S3_BUCKET!;
const ROOT_PREFIX = ((process.env.COURSES_PREFIX || "Khoá học TA/") + "")
  .normalize("NFC")
  .replace(/^\/+/, "")
  .replace(/\/?$/, "/");

const DEV_SEED = process.env.COURSES_DEV_SEED === "1";

export type CourseSummary = {
  slug: string;
  title: string;
  cover?: string;
  access: "premium" | "free";
  lessons: number;
};

export type Lesson = {
  key: string;
  title: string;
  durationSec?: number;
  locked: boolean;
  url?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function listCoursesFromS3(): Promise<CourseSummary[]> {
  const resp = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: ROOT_PREFIX,
    Delimiter: "/",
    MaxKeys: 1000,
  }));

  const folders = resp.CommonPrefixes?.map(cp => (cp.Prefix || "").normalize("NFC"))
    .filter(Boolean) || [];

  if (folders.length === 0 && DEV_SEED) {
    return [
      { slug: slugify("Full Khóa Xóa Mù Ngữ Pháp Cô Mai Phương"), title: "Full Khóa Xóa Mù Ngữ Pháp Cô Mai Phương", access: "premium", lessons: 0 },
      { slug: slugify("40 video học tiếng anh cơ bản nhất giúp bạn hết mất gốc"), title: "40 video học tiếng anh cơ bản nhất giúp bạn hết mất gốc", access: "premium", lessons: 0 },
      { slug: slugify("600 Từ Vựng Toeic Chinh phục mọi chủ đề trong đề thi Toeic"), title: "600 Từ Vựng Toeic", access: "premium", lessons: 0 },
    ];
  }

  const out: CourseSummary[] = [];
  for (const folder of folders) {
    if (folder === ROOT_PREFIX) continue;

    const title = folder.slice(ROOT_PREFIX.length).replace(/\/$/, "");
    const slug = slugify(title);

    // Đếm file .mp4 trong folder
    const items = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: folder,
      MaxKeys: 5000,
    }));
    const files = (items.Contents || []).filter(obj =>
      obj.Key && /\.mp4$/i.test(obj.Key)
    );

    out.push({
      slug,
      title,
      access: "premium",
      lessons: files.length,
    });
  }

  out.sort((a, b) => a.title.localeCompare(b.title, "vi"));
  return out;
}

export async function getCourseDetailFromS3(
  slug: string,
  hasAccess: boolean
): Promise<{ title: string; lessons: Lesson[]; access: "premium" | "free" }> {
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: ROOT_PREFIX,
    Delimiter: "/",
    MaxKeys: 1000,
  }));
  const folders = list.CommonPrefixes?.map(cp => (cp.Prefix || "").normalize("NFC")) || [];

  const folder = folders.find(f =>
    slugify(f.slice(ROOT_PREFIX.length).replace(/\/$/, "")) === slug
  );
  if (!folder) throw new Error("COURSE_NOT_FOUND");

  const title = folder.slice(ROOT_PREFIX.length).replace(/\/$/, "");

  const items = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: folder,
    MaxKeys: 5000,
  }));

  const videos = (items.Contents || [])
    .filter(o => o.Key && /\.mp4$/i.test(o.Key))
    .sort((a, b) => (a.Key || "").localeCompare(b.Key || "", "vi"));

  const lessons: Lesson[] = await Promise.all(
    videos.map(async (obj: _Object) => {
      const key = obj.Key!;
      const base = key.split("/").pop() || key;
      // Đổi tên hiển thị: bỏ .mp4, thay _/- bằng space
      const t = base.replace(/\.mp4$/i, "").replace(/[_-]+/g, " ");

      if (!hasAccess) return { key, title: t, locked: true };

      // Có quyền -> ký URL (1h)
      const signed = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 3600 }
      );
      return { key, title: t, locked: false, url: signed };
    })
  );

  return { title, lessons, access: "premium" };
}
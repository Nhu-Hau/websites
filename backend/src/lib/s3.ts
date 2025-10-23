//backend/src/lib/s3.ts
import path from "path";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const REGION = process.env.AWS_REGION!;
export const BUCKET = process.env.AWS_S3_BUCKET!;
export const PREFIX =
  (process.env.AWS_S3_PREFIX || "community").replace(/^\/|\/$/g, "") + "/";

export const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/** URL public an toàn (bucket có dấu chấm dùng path-style) */
export function s3PublicUrl(bucket: string, key: string) {
  const encBucket = encodeURIComponent(bucket);
  const encKey = encodeURIComponent(key);
  if (bucket.includes(".")) {
    return `https://s3.${REGION}.amazonaws.com/${encBucket}/${encKey}`;
  }
  return `https://${bucket}.s3.${REGION}.amazonaws.com/${encKey}`;
}

/** Lấy object key từ URL public (strip query + decode) */
export function extractKeyFromUrl(bucket: string, url: string): string | null {
  try {
    const u = new URL(url);
    // Chuẩn hoá pathname, bỏ leading '/'
    const path = u.pathname.replace(/^\/+/, "");

    // Path-style: s3.<region>.amazonaws.com/<bucket>/<key>
    if (u.hostname === `s3.${REGION}.amazonaws.com`) {
      const seg = path.split("/");
      if (
        decodeURIComponent(seg[0]) === bucket ||
        seg[0] === encodeURIComponent(bucket)
      ) {
        return decodeURIComponent(seg.slice(1).join("/"));
      }
    }

    // Virtual-hosted-style: <bucket>.s3.<region>.amazonaws.com/<key>
    const hostPrefix = `${bucket}.s3.${REGION}.amazonaws.com`;
    if (u.hostname === hostPrefix) {
      return decodeURIComponent(path);
    }

    // CloudFront/domain khác: cố gắng lấy phần sau 'community/' (PREFIX)
    const idx = path.indexOf(PREFIX);
    if (idx >= 0) {
      return decodeURIComponent(path.slice(idx));
    }

    return null;
  } catch {
    return null;
  }
}

/** Upload buffer -> S3 */
export async function uploadBufferToS3(opts: {
  buffer: Buffer;
  mime: string;
  originalName: string;
  folder?: string; // ⟵ thêm
}) {
  const ext = path.extname(opts.originalName).toLowerCase();
  const base = path
    .basename(opts.originalName, ext)
    .replace(/\s+/g, "_")
    .slice(0, 50);

  // nếu truyền folder thì lưu trong đó, không thì mặc định PREFIX (community/)
  const folder = opts.folder
    ? opts.folder.replace(/^\/|\/$/g, "") + "/"
    : PREFIX;
  const key = `${folder}${Date.now()}_${crypto
    .randomBytes(4)
    .toString("hex")}_${base}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: opts.buffer,
      ContentType: opts.mime,
      ACL: "public-read",
    })
  );

  const url = s3PublicUrl(BUCKET, key);
  const type = opts.mime.startsWith("image/") ? "image" : "file";
  console.log(`[uploadBufferToS3] Uploaded: ${key}, URL: ${url}`);
  return { url, type, name: opts.originalName, key };
}

/** Xoá object trên S3 (nuốt lỗi) */
export async function safeDeleteS3(key: string) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`[safeDeleteS3] Successfully deleted: ${key}`);
  } catch (e) {
    console.warn(`[safeDeleteS3] Failed to delete: ${key}`, e);
  }
}

// backend/src/lib/mongoose.ts
import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __MONGO_CONN__: typeof mongoose | null;
  // eslint-disable-next-line no-var
  var __MONGO_PROMISE__: Promise<typeof mongoose> | null;
}

if (!global.__MONGO_CONN__) global.__MONGO_CONN__ = null;
if (!global.__MONGO_PROMISE__) global.__MONGO_PROMISE__ = null;

const uri = process.env.MONGODB_URI as string;

export async function connectMongo(customUri?: string) {
  const _uri = customUri ?? uri;
  if (!_uri) throw new Error("Missing MONGODB_URI");

  // Đã có connection sẵn
  if (global.__MONGO_CONN__) return global.__MONGO_CONN__;

  // Khởi tạo promise kết nối 1 lần (chống hot-reload)
  if (!global.__MONGO_PROMISE__) {
    mongoose.set("strictQuery", true);
    mongoose.pluralize(null); // TẮT pluralize toàn cục cho đúng instance này

    global.__MONGO_PROMISE__ = mongoose
      .connect(_uri, {
        serverSelectionTimeoutMS: 10_000,
      })
      .then((m) => m);
  }

  global.__MONGO_CONN__ = await global.__MONGO_PROMISE__;
  return global.__MONGO_CONN__;
}

// QUAN TRỌNG: Export đúng instance để các model dùng.
// => Ở tất cả các file model, import mongoose từ đây, KHÔNG import trực tiếp "mongoose".
export { mongoose };
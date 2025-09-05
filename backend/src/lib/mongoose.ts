//backend/src/lib/mongoose.ts
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI as string;

export async function connectMongo() {
  if (!uri) throw new Error("Missing MONGODB_URI");
  // Tránh tạo nhiều kết nối khi hot-reload
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    // Mongoose 7 không cần các option cũ
    serverSelectionTimeoutMS: 10000,
    // keepAlive: true
  });

  return mongoose.connection;
}

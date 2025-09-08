import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "free" | "premium";
  level: "beginner" | "intermediate" | "advanced";
  googleId?: string;
  provider?: "local" | "google";
  picture?: string;
  refreshTokenHash?: string | null;
  refreshTokenExp?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["free", "premium"], default: "free" },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    googleId: String,
    provider: { type: String, default: "local" },
    picture: String,
    refreshTokenHash: { type: String, default: null },
    refreshTokenExp: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const p = String(this.password || "");
  if (p.startsWith("$2a$") || p.startsWith("$2b$")) return next(); // đã hash thì thôi

  this.password = await bcrypt.hash(p, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret: Partial<IUser>) => {
    delete ret.password;
    return ret;
  },
});

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  access: "free" | "premium";
  level: 1 | 2 | 3 | 4;
  googleId?: string;
  provider?: "local" | "google";
  picture?: string;
  refreshTokenHash?: string | null;
  refreshTokenExp?: Date | null;
  levelUpdatedAt?: Date | null;
  levelSource?: "manual" | "placement" | null;           
  lastPlacementAttemptId?: Types.ObjectId | null;         
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
    role: { type: String, enum: ["user", "admin"], default: "user" },
    access: { type: String, enum: ["free", "premium"], default: "free" },
    level: { type: Number, enum: [1, 2, 3, 4], default: 1 },
    googleId: String,
    provider: { type: String, default: "local" },
    picture: String,
    refreshTokenHash: { type: String, default: null },
    refreshTokenExp: { type: Date, default: null },

    // 👇 Metadata level
    levelUpdatedAt: { type: Date, default: null },
    levelSource: { type: String, enum: ["manual", "placement"], default: "manual" },
    lastPlacementAttemptId: { type: Schema.Types.ObjectId, ref: "PlacementAttempt", default: null },
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const p = String(this.password || "");
  if (p.startsWith("$2a$") || p.startsWith("$2b$")) return next();

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
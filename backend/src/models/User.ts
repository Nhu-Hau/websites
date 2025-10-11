import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcrypt";

// ====== Kiểu dùng trong app ======
export type Role = "user" | "admin";
export type Access = "free" | "premium";
export type Lvl = 1 | 2 | 3 | 4;

export interface IPurchase {
  slug: string;
  purchasedAt: Date;
}

export interface IToeicPred {
  overall: number | null;
  listening: number | null;
  reading: number | null;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  access: Access;
  level: Lvl;
  partLevels?: Record<string, Lvl>;
  toeicPred: IToeicPred | null;
  googleId?: string;
  provider?: "local" | "google";
  picture?: string;
  purchases: IPurchase[];
  refreshTokenHash?: string | null;
  refreshTokenExp?: Date | null;
  levelUpdatedAt?: Date | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
}

// ====== Sub-schemas ======
const PurchaseSchema = new Schema<IPurchase>(
  {
    slug: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ToeicPredSchema = new Schema<IToeicPred>(
  {
    overall: { type: Number, default: null },
    listening: { type: Number, default: null },
    reading: { type: Number, default: null },
  },
  { _id: false }
);

// ====== User schema ======
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: { type: String, required: true },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    access: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
      index: true,
    },

    level: { type: Number, enum: [1, 2, 3, 4], default: 1 },

    partLevels: { type: Schema.Types.Mixed, default: {} },

    // Cho phép null an toàn
    toeicPred: { type: ToeicPredSchema, default: null },

    googleId: { type: String, index: true, sparse: true },

    provider: { type: String, enum: ["local", "google"], default: "local" },

    picture: { type: String },

    purchases: { type: [PurchaseSchema], default: [] },

    refreshTokenHash: { type: String, default: null },

    refreshTokenExp: { type: Date, default: null },

    levelUpdatedAt: { type: Date, default: null },

    levelSource: {
      type: String,
      enum: ["manual", "placement"],
      default: "manual",
    },

    lastPlacementAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "PlacementAttempt",
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

// ====== Hooks / Methods ======
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const p = String(this.password || "");
  // đã là bcrypt hash thì bỏ qua
  if (p.startsWith("$2a$") || p.startsWith("$2b$")) return next();

  this.password = await bcrypt.hash(p, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// Ẩn một số field nhạy cảm khi trả JSON
userSchema.set("toJSON", {
  transform: (_doc, ret: Partial<IUser>) => {
    delete (ret as any).password;
    delete (ret as any).refreshTokenHash;
    return ret;
  },
});

// ====== Model export ======
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
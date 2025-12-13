//backend/src/models/User.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcrypt";

// ====== Kiểu dùng trong app ======
export type Role = "user" | "admin" | "teacher";
export type Access = "free" | "premium";
export type Lvl = 1 | 2 | 3;

export interface IPurchase {
  slug: string;
  purchasedAt: Date;
}

export interface IToeicPred {
  overall: number | null;
  listening: number | null;
  reading: number | null;
}

export interface IPartLevelsMeta {
  [partKey: string]: {
    lastChangedAt?: Date | null;
  };
}

export interface IProgressMeta {
  lastAttemptAt?: Date | null;
  lastSuggestedAt?: Date | null;
  completedTests?: number[];
  lastTestVersion?: number | null;
}

export interface IToeicGoal {
  targetScore: number | null; // Mục tiêu TOEIC (ví dụ: 700)
  startScore: number | null; // Điểm khởi đầu khi đặt mục tiêu (ví dụ: 440)
  setAt?: Date | null; // Thời điểm đặt mục tiêu
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  username?: string;
  password: string;
  role: Role;
  access: Access;
  partLevels?: Record<string, Lvl>;
  toeicPred: IToeicPred | null;
  googleId?: string;
  provider?: "local" | "google" | "anonymous";
  picture?: string;
  purchases: IPurchase[];
  refreshTokenHash?: string | null;
  refreshTokenExp?: Date | null;
  recoveryCodeHash?: string | null;
  levelUpdatedAt?: Date | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: Types.ObjectId | null;
  emailVerified?: boolean;
  loginAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  progressMeta?: IProgressMeta;
  toeicGoal?: IToeicGoal;
  followersCount?: number;
  followingCount?: number;
  bio?: string;
  coverImage?: string;
  currentToeicSource?: "unknown" | "self_report_official" | null;
  currentToeicScore?: number | null;
  currentToeicExamDate?: string | null;
  premiumExpiryDate?: Date | null; // Ngày hết hạn premium
  last_login?: Date | null; // Thời gian đăng nhập cuối

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

const ProgressMetaSchema = new Schema<IProgressMeta>(
  {
    lastAttemptAt: { type: Date, default: null },
    lastSuggestedAt: { type: Date, default: null },
    completedTests: { type: [Number], default: [] },
    lastTestVersion: { type: Number, default: null },
  },
  { _id: false }
);

const ToeicGoalSchema = new Schema<IToeicGoal>(
  {
    targetScore: { type: Number, default: null },
    startScore: { type: Number, default: null },
    setAt: { type: Date, default: null },
  },
  { _id: false }
);

// ====== User schema ======
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: false, // Email không bắt buộc cho tài khoản ẩn danh
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true, // Cho phép nhiều user có email null
      default: undefined,
    },

    username: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null nếu user cũ chưa có
      trim: true,
      index: true,
      default: undefined,
    },

    password: { type: String, required: true },

    role: { type: String, enum: ["user", "admin", "teacher"], default: "user" },

    access: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
      index: true,
    },

    partLevels: { type: Schema.Types.Mixed, default: {} },

    // Cho phép null an toàn
    toeicPred: { type: ToeicPredSchema, default: null },

    googleId: { type: String, index: true, sparse: true },

    provider: { type: String, enum: ["local", "google", "anonymous"], default: "local" },

    picture: { type: String },

    purchases: { type: [PurchaseSchema], default: [] },

    refreshTokenHash: { type: String, default: null },

    refreshTokenExp: { type: Date, default: null },

    recoveryCodeHash: { type: String, default: null }, // Mã khôi phục cho tài khoản ẩn danh

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

    emailVerified: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockedUntil: { type: Date, default: null },

    progressMeta: {
      type: ProgressMetaSchema,
      default: () => ({ completedTests: [] }),
    },

    toeicGoal: { type: ToeicGoalSchema, default: null },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    bio: { type: String, trim: true, default: "" },
    coverImage: { type: String, default: null },
    currentToeicSource: {
      type: String,
      enum: ["unknown", "self_report_official"],
      default: null,
    },
    currentToeicScore: { type: Number, default: null },
    currentToeicExamDate: { type: String, default: null },
    premiumExpiryDate: { type: Date, default: null },
    last_login: { type: Date, default: null },
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
  mongoose.models.User || mongoose.model<IUser>("User", userSchema, "users");

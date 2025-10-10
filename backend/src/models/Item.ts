import mongoose, { Schema, Document } from "mongoose";

export type ChoiceId = "A" | "B" | "C" | "D";

export interface IChoice {
  id: ChoiceId;         // A/B/C/D
  text?: string;        // có thể trống (đối với Part 1 chỉ chọn A-D)
}

export interface IItem extends Document {
  // business id riêng (không phải _id của Mongo)
  id: string;           // ví dụ: "lv1_t1_p1_001"
  part: "part.1" | "part.2" | "part.3" | "part.4" | "part.5" | "part.6" | "part.7";
  stimulusId?: string | null;  // group theo stimulus (ảnh/audio/đoạn văn)
  stem?: string | null;        // đề bài/ câu hỏi hiển thị
  choices: IChoice[];          // [{id:"A", text:"..."}, ...]
  answer: ChoiceId;            // "A" | "B" | "C" | "D"
  level: 1 | 2 | 3 | 4;        // level của câu
  media?: {
    image?: string | string[]; // ảnh cho stimulus/câu (tùy bạn dùng ở FE)
    audio?: string;
    script?: string;           // transcript
    explain?: string;          // giải thích
  };
  // timestamps từ schema options
  createdAt: Date;
  updatedAt: Date;
}

const ChoiceSchema = new Schema<IChoice>(
  {
    id: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    text: { type: String, default: "" },
  },
  { _id: false }
);

const ItemSchema = new Schema<IItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    part: {
      type: String,
      required: true,
      enum: ["part.1", "part.2", "part.3", "part.4", "part.5", "part.6", "part.7"],
      index: true,
    },
    stimulusId: { type: String, default: null, index: true },
    stem: { type: String, default: null },
    choices: { type: [ChoiceSchema], default: [] },
    answer: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    level: { type: Number, required: true, enum: [1, 2, 3, 4], index: true },
    media: {
      image: { type: Schema.Types.Mixed, default: undefined }, // string | string[]
      audio: { type: String, default: undefined },
      script: { type: String, default: undefined },
      explain: { type: String, default: undefined },
    },
  },
  { timestamps: true, versionKey: false, collection: "items" } // đổi "items" nếu bạn đang dùng tên collection khác
);

// đảm bảo id unique
ItemSchema.index({ id: 1 }, { unique: true });

export const Items = mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
import { Schema, Types } from "mongoose";
import { mongoose } from "../../config/database";
mongoose.pluralize(null);

const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", index: true, required: true },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "follow",
        "mention",
        "reaction",
        "repost",
        "group_invite",
        "group_post",
        "system",
      ],
      default: "system",
    },
    message: { type: String, required: true },
    link: { type: String, default: "#" },
    meta: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    fromUserId: { type: Types.ObjectId, ref: "User", default: null }, // User who triggered the notification
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "notifications", timestamps: true }
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema, "notifications");
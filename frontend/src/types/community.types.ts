export type UserLite = {
  _id: string;
  name?: string;
  avatarUrl?: string;
};

export type Attachment = {
  type: "image" | "video" | "link" | "file";
  url: string;  // luôn là "/uploads/xxx" hoặc URL tuyệt đối
  name?: string;
  size?: number;
  key?: string;
  duration?: number; // For video duration in seconds
  thumbnail?: string; // For video thumbnail URL
};

export type CommunityPost = {
  _id: string;
  userId: string;
  user?: UserLite;
  content: string;
  attachments: Attachment[];
  likesCount: number;
  commentsCount: number;
  savedCount?: number;
  repostCount?: number;
  liked?: boolean;
  saved?: boolean;
  canDelete?: boolean;
  repostedFrom?: string;
  repostCaption?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityComment = {
  _id: string;
  postId: string;
  userId: string;
  user?: UserLite;
  content: string;
  attachments: Attachment[];
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
};
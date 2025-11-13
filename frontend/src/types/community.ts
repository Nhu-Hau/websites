export type UserLite = {
  _id: string;
  name?: string;
  avatarUrl?: string;
};

export type Attachment = {
  type: "image" | "link" | "file";
  url: string;  // luôn là "/uploads/xxx" hoặc URL tuyệt đối
  name?: string;
  size?: number;
};

export type CommunityPost = {
  _id: string;
  userId: string;
  user?: UserLite;
  content: string;
  attachments: Attachment[];
  likesCount: number;
  commentsCount: number;
  liked?: boolean;
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
  createdAt: string;
  updatedAt: string;
};
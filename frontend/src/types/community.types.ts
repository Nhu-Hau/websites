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
  tags?: string[];
  mentions?: string[];
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
  isEdited?: boolean;
  editedAt?: string;
  groupId?: string;
  practiceAttemptId?: string;
  poll?: {
    _id: string;
    question: string;
    options: Array<{
      text: string;
      votesCount: number;
      voted?: boolean;
    }>;
    votersCount: number;
    hasVoted?: boolean;
    endsAt?: string;
  };
  reactions?: {
    type: string;
    count: number;
    userReacted?: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type CommunityComment = {
  _id: string;
  postId: string;
  userId: string;
  parentCommentId?: string; // For nested replies
  user?: UserLite;
  content: string;
  mentions?: string[];
  attachments: Attachment[];
  canDelete?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  reactions?: {
    type: string;
    count: number;
    userReacted?: boolean;
  }[];
  replies?: CommunityComment[]; // Nested replies
  createdAt: string;
  updatedAt: string;
};
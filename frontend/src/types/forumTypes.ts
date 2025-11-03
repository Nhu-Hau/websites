export type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  excerpt: string;
};

export type Comment = {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
};

export type ForumState = {
  posts: Post[];
  comments: Comment[];
};

export type ForumContextValue = {
  posts: Post[];
  comments: Comment[];
  addPost: (data: { title: string; content: string; author?: string }) => Post;
  addComment: (data: { postId: string; content: string; author?: string }) => Comment;
};


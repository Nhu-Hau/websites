export type Comment = {
  id: string; // unique id (uuid-like string)
  postId: string;
  author: string;
  content: string;
  createdAt: string; // ISO date string
};

export type Post = {
  id: string; // unique id (uuid-like string)
  title: string;
  content: string; // full content
  author: string;
  createdAt: string; // ISO date string
  // derived field for list preview
  excerpt?: string;
};

export type ForumState = {
  posts: Post[];
  comments: Comment[];
};

export type ForumContextValue = ForumState & {
  addPost: (data: { title: string; content: string; author?: string }) => Post;
  addComment: (data: {
    postId: string;
    content: string;
    author?: string;
  }) => Comment;
};
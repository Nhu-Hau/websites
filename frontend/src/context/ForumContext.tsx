"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// Types defined inline since forumTypes.ts doesn't exist
type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  excerpt?: string;
};

type Comment = {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
};

type ForumState = {
  posts: Post[];
  comments: Comment[];
};

type ForumContextValue = {
  posts: Post[];
  comments: Comment[];
  addPost: (data: { title: string; content: string; author?: string }) => Post;
  addComment: (data: {
    postId: string;
    content: string;
    author?: string;
  }) => Comment;
};

// Mock data
const mockPosts: Post[] = [];
const mockComments: Comment[] = [];

const STORAGE_KEY = "community-forum-state-v1";

const ForumContext = createContext<ForumContextValue | null>(null);

function uid(prefix: string) {
  // Lightweight uid for demo (not crypto-strong)
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ForumProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ForumState>({ posts: [], comments: [] });

  // Load from localStorage (or fallback to mockData on first run)
  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ForumState;
        setState(parsed);
        return;
      } catch {}
    }
    setState({ posts: mockPosts, comments: mockComments });
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (state.posts.length || state.comments.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const value = useMemo<ForumContextValue>(
    () => ({
      posts: state.posts,
      comments: state.comments,
      addPost: ({ title, content, author = "Guest" }) => {
        const post: Post = {
          id: uid("p"),
          title: title.trim(),
          content: content.trim(),
          author,
          createdAt: new Date().toISOString(),
          excerpt:
            content.trim().slice(0, 120) + (content.length > 120 ? "…" : ""),
        };
        setState((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
        return post;
      },
      addComment: ({ postId, content, author = "Guest" }) => {
        const c: Comment = {
          id: uid("c"),
          postId,
          author,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };
        setState((prev) => ({ ...prev, comments: [c, ...prev.comments] }));
        return c;
      },
    }),
    [state.posts, state.comments]
  );

  return (
    <ForumContext.Provider value={value}>{children}</ForumContext.Provider>
  );
}

export function useForum() {
  const ctx = useContext(ForumContext);
  if (!ctx) throw new Error("useForum must be used within ForumProvider");
  return ctx;
}

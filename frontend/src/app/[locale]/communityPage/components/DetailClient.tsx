"use client";

import { useForum } from "@/app/context/ForumContext";
import PostDetail from "./PostDetail";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

export default function DetailClient({ postId }: { postId: string }) {
  const { posts } = useForum();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center text-slate-200">
        Không tìm thấy bài viết.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PostDetail post={post} />
      <section>
        <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
          Bình luận
        </h3>
        <CommentForm postId={post.id} />
        <div className="mt-5">
          <CommentList postId={post.id} />
        </div>
      </section>
    </div>
  );
}

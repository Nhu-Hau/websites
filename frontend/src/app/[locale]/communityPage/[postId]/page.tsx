import { ForumProvider } from "@/context/ForumContext";
import DetailClient from "../components/DetailClient";

export default function PostDetailPage({
  params,
}: {
  params: { locale: string; postId: string };
}) {
  return (
    <div
      className="
        min-h-screen
        bg-slate-100 text-slate-900
        dark:bg-slate-900 dark:text-white
      "
    >
      <header className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16 sm:pt-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Chi tiết bài viết
        </h1>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20">
        <ForumProvider>
          <DetailClient postId={params.postId} />
        </ForumProvider>
      </main>
    </div>
  );
}

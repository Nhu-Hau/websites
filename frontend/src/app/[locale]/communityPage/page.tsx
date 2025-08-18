import { ForumProvider } from "@/app/context/ForumContext";
import PostList from "./components/PostList";

export default function CommunityPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string };
}) {
  const locale = params.locale || "vi";
  const page = Number(searchParams?.page || "1");

  return (
    <div
      className="
        min-h-screen 
        bg-slate-100 dark:bg-slate-900
        text-slate-900 dark:text-white
      "
    >
      {/* Header */}
      <div className="relative isolate">
        <header className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16 sm:pt-20">
          <h1
            className="
              text-3xl font-bold tracking-tight sm:text-4xl
              text-slate-900 dark:text-white
            "
          >
            Community Forum
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Nơi trao đổi kiến thức về Next.js, TypeScript và Tailwind. Tất cả dữ
            liệu đang ở chế độ mock (không cần backend).
          </p>
        </header>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-20">
        <ForumProvider>
          <PostList locale={locale} currentPage={page} perPage={6} />
        </ForumProvider>
      </main>
    </div>
  );
}

import { ForumProvider } from "@/app/lib/forum/context";
import NewPostForm from "../components/NewPostForm";

export default function NewPostPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16 sm:pt-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Đăng bài viết mới</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Bài viết sẽ được lưu tạm trong trình duyệt (localStorage).</p>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-20">
        <ForumProvider>
          <NewPostForm />
        </ForumProvider>
      </main>
    </div>
  );
}
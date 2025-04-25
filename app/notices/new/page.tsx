import { checkAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { NoticeForm } from "@/components/forms/notice-form";

export default async function NewNoticePage() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/notices");
  }

  return (
    <main className="flex-1 py-8 md:py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">새 공지 작성</h1>
        <NoticeForm mode="create" />
      </div>
    </main>
  );
}

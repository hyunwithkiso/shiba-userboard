import { notFound, redirect } from "next/navigation";
import { notices } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NoticeForm } from "@/components/forms/notice-form";
import { checkAdmin } from "@/lib/auth-utils";
import { Metadata } from "next";

interface EditNoticePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditNoticePageProps): Promise<Metadata> {
  const id = (await params).id;
  return {
    title: `공지사항 수정 | ${id}`,
    description: "공지사항 내용을 수정합니다.",
  };
}

async function getNoticeForEdit(id: string) {
  const result = await db
    .select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      isPinned: notices.isPinned,
    })
    .from(notices)
    .where(eq(notices.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }
  return result[0];
}

export default async function EditNoticePage({ params }: EditNoticePageProps) {
  const { id } = await params;

  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/notices");
  }

  const noticeData = await getNoticeForEdit(id);

  if (!noticeData) {
    notFound();
  }

  return (
    <main className="flex-1 py-24 md:py-24">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">공지사항 수정</h1>
        <NoticeForm
          mode="edit"
          noticeId={id}
          initialData={{
            title: noticeData.title,
            content: noticeData.content,
            isPinned: noticeData.isPinned,
          }}
        />
      </div>
    </main>
  );
}

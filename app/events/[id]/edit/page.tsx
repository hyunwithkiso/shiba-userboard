import { checkAdmin } from "@/lib/auth-utils";
import { redirect, notFound } from "next/navigation";
import { db, events } from "@/lib/schema"; // Import events table
import { eq } from "drizzle-orm";
import { EventForm } from "@/components/forms/event-form"; // Import EventForm
import { Metadata } from "next";

// Metadata 생성 함수 (선택 사항)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // Fetch the event data to get the title
  const eventDataResult = await db
    .select({ title: events.title })
    .from(events)
    .where(eq(events.id, (await params).id))
    .limit(1);
  const eventTitle = eventDataResult[0]?.title;

  return {
    title: eventTitle ? `이벤트 수정: ${eventTitle}` : "이벤트 수정 | SHIBA",
    description: `${eventTitle || "이벤트"}를 수정합니다.`,
  };
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. 관리자 권한 확인
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/events");
  }

  // 2. 이벤트 데이터 불러오기
  const eventDataResult = await db
    .select({
      title: events.title,
      content: events.content,
      thumbnailImage: events.thumbnailImage,
      startDate: events.startDate,
      endDate: events.endDate,
      isPinned: events.isPinned,
    })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (eventDataResult.length === 0) {
    notFound(); // 이벤트 없으면 404
  }

  const initialDbData = eventDataResult[0];

  // 3. Prepare initialData for the form
  // content 타입 처리 로직 제거
  // let initialContent: SerializedEditorState | undefined;
  // if (initialDbData.content && typeof initialDbData.content === "object") { ... }

  // Ensure dates are Date objects or undefined (with validation)
  const startDate = initialDbData.startDate
    ? (() => {
        const date = new Date(initialDbData.startDate);
        return isNaN(date.getTime()) ? undefined : date;
      })()
    : undefined;
  const endDate = initialDbData.endDate
    ? (() => {
        const date = new Date(initialDbData.endDate);
        return isNaN(date.getTime()) ? undefined : date;
      })()
    : undefined;

  // Assemble the final initialData prop
  const initialFormData = {
    title: initialDbData.title,
    content: initialDbData.content,
    thumbnailImage: initialDbData.thumbnailImage,
    startDate: startDate,
    endDate: endDate,
    isPinned: initialDbData.isPinned,
  };

  return (
    <main className="flex-1 py-8 md:py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">이벤트 수정</h1>
        <EventForm mode="edit" eventId={id} initialData={initialFormData} />
      </div>
    </main>
  );
}

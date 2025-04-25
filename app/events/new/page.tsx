import { checkAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/forms/event-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 이벤트 작성 | SHIBA",
  description: "새로운 이벤트를 작성합니다.",
};

export default async function NewEventPage() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/events");
  }

  return (
    <main className="flex-1 py-8 md:py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">새 이벤트 작성</h1>
        <EventForm mode="create" />
      </div>
    </main>
  );
}

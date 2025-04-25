import { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatTitleUploadForm from "@/components/chat-title/chat-title-upload-form";

export const metadata: Metadata = {
  title: "채팅 칭호 업로드",
  description: "개인 채팅 칭호를 업로드합니다.",
};

export default async function ChatTitlePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const isAdmin = session.user.isAdmin ?? false;

  if (!isAdmin && !session.user.gameId) {
    redirect("/init");
  }

  return (
    <main className="container max-w-5xl py-6 space-y-8 mx-auto">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 p-8">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3">
          <MessageSquare className="w-48 h-48 text-white/10" />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white mb-2">
            채팅 칭호 업로드
          </h1>
          <p className="text-white/80">
            채팅 칭호 이미지를 업로드하세요. 업로드된 이미지는 검토 후
            승인됩니다.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">이미지 업로드</h2>
          <ChatTitleUploadForm />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">업로드 가이드라인</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>이미지는 PNG, WebP, GIF 형식만 허용됩니다.</li>
            <li>파일 크기는 500KB 이하여야 합니다.</li>
            <li>
              이미지 크기는 180px ~ 220px (가로) x 40px ~ 50px (세로)여야
              합니다.
            </li>
            <li>최종 승인 시 크기 및 영역은 변경될 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

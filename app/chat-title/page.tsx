import { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatTitleUploadForm from "@/components/chat-title/chat-title-upload-form";
import { checkUserInitialization } from "@/lib/auth-utils";
import { realtimeService } from "@/services/realtime-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "채팅 칭호 업로드",
  description: "개인 채팅 칭호를 업로드합니다.",
};

export default async function ChatTitlePage() {
  await checkUserInitialization();
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const userId = session.user?.userId;

  if (!userId) {
    redirect("/login");
  }
  if (session.user && session.user?.nickname === null) {
    redirect("/init");
  }

  const ticketInfo = await realtimeService.getCheckAvailableChatTitle(
    Number(userId)
  );
  const isAdmin = !!session.user?.isAdmin;
  const hasTicket = ticketInfo.amount > 0;
  console.log(ticketInfo);

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

      {/* 아이템 생성 안내 문구 */}
      <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
        <Info className="h-4 w-4 stroke-emerald-600 dark:stroke-emerald-400" />
        <AlertDescription className="text-emerald-800 dark:text-emerald-200">
          <strong>중요:</strong> 이미지 이름은 아이템 이름으로 사용되며, '이미지이름' 채팅 칭호로 생성됩니다.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">이미지 업로드</h2>
          {hasTicket ? (
            <div className="mb-4 text-sm text-muted-foreground">
              보유 티켓: <span className="font-bold text-primary">{ticketInfo.amount}</span>장
            </div>
          ) : (
            <div className="mb-4 text-destructive font-semibold">
              채팅 칭호 이용권이 부족합니다. 상점에서 구매 후 이용해 주세요.
            </div>
          )}
          <ChatTitleUploadForm />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">업로드 가이드라인</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>이미지는 PNG, WebP, GIF 형식만 허용됩니다.</li>
            <li className="font-medium text-orange-600 dark:text-orange-400">
              파일 크기는 200KB 이하여야 합니다.
            </li>
            <li className="font-medium text-primary">
              이미지 크기는 정확히 200px x 50px 이어야 합니다.
            </li>
            <li>이미지 이름은 최대 10자까지 입력 가능합니다.</li>
            <li>채팅창에서의 width는 100px로 고정됩니다.</li>
            <li>업로드된 이미지는 관리자 검토 후 게임에 적용됩니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

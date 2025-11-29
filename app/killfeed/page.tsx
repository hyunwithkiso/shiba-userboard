import { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Target } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUserData } from "@/lib/user-validation";
import { UploadForm } from "@/components/shared/upload-form";
import { checkUserInitialization } from "@/lib/auth-utils";
import { realtimeService } from "@/services/realtime-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "킬피드 업로드",
  description: "킬피드 이미지를 업로드합니다.",
};

export default async function KillfeedPage() {
  try {
    // 병렬로 인증 체크 및 사용자 데이터 확인
    const [, session, userData] = await Promise.all([
      checkUserInitialization(),
      auth(),
      getCurrentUserData()
    ]);

    if (!session) {
      redirect("/login");
    }

    if (!userData?.userId) {
      redirect("/init");
    }

    if (!userData.nickname) {
      redirect("/init");
    }

    // 티켓 정보 조회 (타임아웃 적용)
    let ticketInfo;
    try {
      ticketInfo = await Promise.race([
        realtimeService.getCheckAvailableKillFeed(Number(userData.userId)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
    } catch (error) {
      console.warn('티켓 정보 조회 실패:', error);
      // 기본값으로 fallback
      ticketInfo = { amount: 0 };
    }

    const isAdmin = userData.isAdmin;
    const hasTicket = ticketInfo.amount > 0;

    return (
      <main className="container max-w-8xl py-24 space-y-8 mx-auto">
        {/* 헤더 섹션 */}
        <div className="relative overflow-hidden rounded-lg bg-card border border-border p-8">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3">
            <Target className="w-48 h-48 text-muted-foreground/10" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">킬피드 업로드</h1>
                <p className="text-muted-foreground mt-1">
                  킬피드 이미지를 업로드하세요. 업로드된 이미지는 검토 후 승인됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 중요 안내 */}
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <strong>중요:</strong> 이미지 이름은 아이템 이름으로 사용되며, '이미지이름' 킬피드로 생성됩니다.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* 업로드 섹션 */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground">이미지 업로드</h2>
            </div>

            {hasTicket ? (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-sm text-foreground">
                  보유 티켓: <span className="font-bold text-primary">{ticketInfo.amount}</span>장
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="text-sm font-semibold text-destructive">
                  킬피드 이용권이 부족합니다. 상점에서 구매 후 이용해 주세요.
                </div>
              </div>
            )}

            <UploadForm
              type="killfeed"
              endpoint="/api/images/killfeed"
              exactWidth={640}
              exactHeight={140}
              successMessage="킬피드가 성공적으로 업로드되었습니다."
            />
          </div>

          {/* 가이드라인 섹션 */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">업로드 가이드라인</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground">이미지는 PNG, WebP, GIF 형식만 허용됩니다.</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium text-primary">파일 크기는 500KB 이하</span>여야 합니다.
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground">
                  <span className="font-medium text-primary">이미지 크기는 정확히 640px x 140px</span> 이어야 합니다.
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground">이미지 이름은 최대 10자까지 입력 가능합니다.</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground">업로드된 이미지는 관리자 검토 후 게임에 적용됩니다.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('킬피드 페이지 로딩 실패:', error);

    // 에러 발생 시 로그인 페이지로 리다이렉트
    redirect("/login");
  }
}

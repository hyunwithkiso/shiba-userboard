import { Suspense } from "react";
import { Hourglass } from "lucide-react";
import { CheckoutCompleteClient } from "@/components/checkout/checkout-complete-client";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

// 페이지 컴포넌트 (서버 컴포넌트)
export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ "txn-id"?: string; transaction_id?: string }>;
}) {
  const { "txn-id": txn_id, transaction_id } = await searchParams;
  const txnId = txn_id || transaction_id;

  // 사용자 basketIdent 조회
  const session = await auth();
  const userId = session?.user?.id;
  let basketIdent: string | null = null;
  if (userId) {
    const row = await db.select({ basketIdent: users.basketIdent }).from(users).where(eq(users.id, userId)).limit(1);
    basketIdent = row[0]?.basketIdent || null;
  }

  if (!basketIdent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Hourglass className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">장바구니 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // Suspense로 클라이언트 컴포넌트를 감쌉니다.
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Hourglass className="h-16 w-16 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutCompleteClient basketIdent={basketIdent} txn_id={txnId} />
    </Suspense>
  );
}

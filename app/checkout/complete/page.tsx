import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { Hourglass } from "lucide-react";
import { CheckoutCompleteClient } from "@/components/checkout/checkout-complete-client";
import { db } from "@/lib/schema";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

// 페이지 컴포넌트 (서버 컴포넌트)
export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ "txn-id"?: string; transaction_id?: string }>;
}) {
  // 서버에서 사용자 정보 및 basketIdent 가져오기

  const { "txn-id": txn_id, transaction_id } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  // "txn-id" 또는 "transaction_id" 파라미터를 모두 확인
  const txnId = txn_id || transaction_id;

  console.log("Transaction ID:", txnId);

  let basketIdent: string | null = null;

  if (!txnId) {
    console.log("No transaction ID found in URL parameters");
    // return <div>Transaction ID is required</div>;
  }

  if (userId) {
    // 사용자의 basketIdent 조회
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log("User data found:", userData.length > 0);

    basketIdent = userData[0]?.basketIdent || null;
    console.log(`[Server] User ${userId} basketIdent: ${basketIdent}`);
  } else {
    console.log(`[Server] No authenticated user found.`);
  }

  // basketIdent가 없으면 로딩 상태 표시
  if (!basketIdent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Hourglass className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            장바구니 정보를 찾을 수 없습니다.
          </p>
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

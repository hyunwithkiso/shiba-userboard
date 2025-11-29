import type { Metadata } from "next";
import Link from "next/link";
import { purchases } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PurchaseHistoryList } from "@/components/purchases/purchase-history-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "구매 내역 | SHIBA 상점",
  description: "과거 구매 기록을 확인합니다.",
};

// 구매 내역 데이터 타입 (스키마 기반 확장)
export type PurchaseHistoryItem = typeof purchases.$inferSelect & {
  // 필요시 사용자 정보 등 join된 데이터 추가
};

// 구매 내역 페이지 컴포넌트
export default async function PurchasesPage() {
  const session = await auth(); // NextAuth 사용

  if (!session?.user?.id) {
    // 로그인하지 않은 사용자는 홈페이지로 리디렉션
    redirect("/");
  }

  const userId = session.user.id; // 사용자 ID 가져오기

  let userPurchases: PurchaseHistoryItem[] = [];
  try {
    userPurchases = await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId)) // userId 사용
      .orderBy(desc(purchases.purchasedAt)); // desc 함수 사용으로 수정
  } catch (error) {
    console.error("Failed to fetch purchase history:", error);
    // 오류 발생 시 메시지 표시
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>
              구매 내역을 불러오는 중 오류가 발생했습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-8xl px-4 py-24 md:py-24">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">구매 내역</h1>
      </div>

      {userPurchases.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">구매 기록 없음</CardTitle>
            <CardDescription className="text-base">
              아직 구매한 상품이 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild className="px-8">
              <Link href="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                상점으로 가기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PurchaseHistoryList purchaseHistory={userPurchases} />
      )}
    </div>
  );
}

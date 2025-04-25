import type { Metadata } from "next";
import Link from "next/link";
import { db, purchases, users } from "@/lib/schema"; // 스키마 경로 확인
import { eq, desc } from "drizzle-orm";
// import { createClient } from '@/utils/supabase/server'; // Supabase 대신 NextAuth 사용
import { auth } from "@/lib/auth"; // NextAuth auth 함수 임포트
import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "구매 내역 | SHIBA 상점",
  description: "과거 구매 기록을 확인합니다.",
};

// 구매 내역 데이터 타입 (스키마 기반 확장)
type PurchaseHistoryItem = typeof purchases.$inferSelect & {
  // 필요시 사용자 정보 등 join된 데이터 추가
};

// 구매 내역 페이지 컴포넌트
export default async function PurchasesPage() {
  // const supabase = createClient(); // 제거
  const session = await auth(); // NextAuth 사용

  // if (!user) { // session.user 확인
  if (!session?.user?.id) {
    // 로그인하지 않은 사용자는 홈페이지로 리디렉션
    redirect("/"); // 리디렉션 경로 변경
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
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-6">구매 내역</h1>

      {userPurchases.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>구매 기록 없음</CardTitle>
            <CardDescription>아직 구매한 상품이 없습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/shop">상점으로 가기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {" "}
            {/* 테이블 패딩 제거 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문일</TableHead>
                  <TableHead>상품 정보</TableHead>
                  <TableHead className="text-right">결제 금액</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  {/* <TableHead className="text-right">주문 ID</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPurchases.map((purchase) => {
                  // items가 배열인지 확인하고, 아니면 빈 배열로 처리
                  const itemsArray = Array.isArray(purchase.items)
                    ? purchase.items
                    : [];
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {purchase.purchasedAt
                          ? new Date(purchase.purchasedAt).toLocaleDateString(
                              "ko-KR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {itemsArray.length > 0 ? (
                            itemsArray.map((item: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">
                                  {item.name || "알 수 없는 상품"}
                                </span>
                                {item.quantity > 1 && ` x ${item.quantity}`}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              상품 정보 없음
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {/* totalAmount는 cents 단위라고 가정 */}
                        {formatPrice(
                          purchase.totalAmount ? purchase.totalAmount / 100 : 0,
                          purchase.currency
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            purchase.status === "completed"
                              ? "default"
                              : purchase.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="text-right text-xs text-muted-foreground">{purchase.id}</TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

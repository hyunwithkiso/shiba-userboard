import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { purchaseService } from "@/services/purchase-service";
import { ResetBasketButton } from "@/components/reset-basket-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, Package } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 완료 | SHIBA",
  description: "상품 구매가 성공적으로 완료되었습니다.",
};

// Helper function to format currency (assuming cents)
function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined
) {
  if (amount === null || amount === undefined) return "N/A";
  return `${(amount / 100).toFixed(2)} ${currency || "USD"}`;
}

async function PurchaseDetails({ basketIdent }: { basketIdent: string }) {
  try {
    const purchase = await purchaseService.getPurchaseByBasketIdent(
      basketIdent
    );

    if (!purchase) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>구매 내역 조회 실패</AlertTitle>
          <AlertDescription>
            해당 ID({basketIdent})의 구매 내역을 찾을 수 없습니다. 문제가
            지속되면 문의해주세요.
          </AlertDescription>
        </Alert>
      );
    }

    // Ensure items is an array before processing
    const items = Array.isArray(purchase.items) ? purchase.items : [];

    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-2xl">결제가 완료되었습니다!</CardTitle>
          <CardDescription>
            구매해주셔서 감사합니다. 상품은 게임 내에서 확인하실 수 있습니다.
            (주문 ID: {purchase.id})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <h3 className="font-semibold">구매 상품 정보</h3>
          <ul className="space-y-2 text-sm">
            {items.map((item: any, index: number) => (
              <li key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>
                    {item.name || "상품명 없음"} x{item.quantity || 1}
                  </span>
                </div>
                <span>
                  {formatCurrency(item.totalPrice, purchase.currency)}
                </span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>총 결제 금액</span>
            <span>
              {formatCurrency(purchase.totalAmount, purchase.currency)}
            </span>
          </div>
          {/* Display purchase ID or transaction ID if available */}
          {/* <p className="text-xs text-muted-foreground text-center pt-2">Transaction ID: {purchase.id}</p> */}
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <ResetBasketButton className="w-full" />
          <Button variant="outline" asChild className="w-full">
            <Link href="/shop">상점으로 돌아가기</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    console.error("[PurchaseDetails] Error:", error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류 발생</AlertTitle>
        <AlertDescription>
          구매 내역을 불러오는 중 오류가 발생했습니다. 잠시 후 다시
          시도해주세요.
        </AlertDescription>
      </Alert>
    );
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // TODO: Tebex에서 실제로 사용하는 쿼리 파라미터 이름 확인 필요 (예: basket_ident, transaction_id 등)
  const { basket_ident } = (await searchParams) || {};

  if (!basket_ident) {
    // basketIdent가 없으면 구매 정보를 표시할 수 없음
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
        <Alert
          variant="default"
          className="max-w-md border-yellow-500 text-yellow-700"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>잘못된 접근</AlertTitle>
          <AlertDescription>
            결제 정보를 확인할 수 없습니다. 주문 ID가 누락되었습니다.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex gap-4">
          <Button asChild>
            <Link href="/shop">상점으로 돌아가기</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/purchases">내 구매내역</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-10 px-4">
      {/* Suspense 추가하여 로딩 상태 처리 가능 */}
      <Suspense
        fallback={
          <Card className="w-full max-w-lg animate-pulse">
            <CardHeader className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-6 w-full" />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        }
      >
        <PurchaseDetails basketIdent={basket_ident as string} />
      </Suspense>
    </div>
  );
}

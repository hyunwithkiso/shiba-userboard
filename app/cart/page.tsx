import { basketService } from "@/services/basket-service";
import { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { CartItems } from "@/components/cart/cart-items"; // 생성 예정
import { TebexBasket } from "@/lib/tebex";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // 로딩 상태용

export const metadata: Metadata = {
  title: "장바구니 | SHIBA",
  description: "장바구니에 담긴 상품을 확인하고 결제를 진행합니다.",
};

// 로딩 스켈레톤 컴포넌트
function CartLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/4" /> {/* Title Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded" /> {/* Image Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" /> {/* Name Skeleton */}
                <Skeleton className="h-4 w-24" /> {/* Price Skeleton */}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-16" /> {/* Quantity Input Skeleton */}
              <Skeleton className="h-10 w-20" /> {/* Update Button Skeleton */}
              <Skeleton className="h-10 w-10" /> {/* Remove Button Skeleton */}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end items-center space-x-4 border-t pt-4">
        <Skeleton className="h-6 w-24" /> {/* Total Text Skeleton */}
        <Skeleton className="h-10 w-32" /> {/* Checkout Button Skeleton */}
      </div>
    </div>
  );
}

// 장바구니 데이터를 가져와 렌더링하는 비동기 서버 컴포넌트
async function CartPageContent() {
  const session = await auth();
  let basket: TebexBasket | null = null;
  let error: string | null = null;

  if (session?.user?.id) {
    try {
      basket = await basketService.getUserBasket();
    } catch (err) {
      console.error("[CartPage] Error fetching user basket:", err);
      error = "장바구니 정보를 가져오는 중 오류가 발생했습니다.";
    }
  } else {
    error = "로그인이 필요합니다.";
    // 또는 비로그인 사용자를 위한 로컬 장바구니 로직을 여기에 추가할 수 있습니다.
    // 현재 구현에서는 로그인된 사용자만 가정합니다.
  }

  // 오류 발생 시
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-destructive gap-4 border rounded-lg p-8 bg-destructive/10">
        <AlertCircle className="h-12 w-12" />
        <h2 className="text-xl font-semibold">오류</h2>
        <p>{error}</p>
        {!session?.user?.id && (
          <Button asChild variant="default" className="mt-4">
            <Link href="/api/auth/signin">로그인</Link>
          </Button>
        )}
      </div>
    );
  }

  // 장바구니가 비어있거나 없는 경우
  if (!basket || !basket.packages || basket.packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-4 border rounded-lg p-8">
        <ShoppingCart className="h-12 w-12" />
        <h2 className="text-xl font-semibold">장바구니가 비어 있습니다</h2>
        <p>상점에서 상품을 추가해보세요.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/shop">상점으로 가기</Link>
        </Button>
      </div>
    );
  }

  // 장바구니 정보가 있을 경우 클라이언트 컴포넌트에 전달
  return <CartItems initialBasket={basket} />;
}

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">장바구니</h1>
      <Suspense fallback={<CartLoadingSkeleton />}>
        <CartPageContent />
      </Suspense>
    </div>
  );
}

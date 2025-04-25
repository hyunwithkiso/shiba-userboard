"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { useToast } from '@/components/ui/use-toast'; // Toast 사용 (경로 오류로 임시 주석 처리)
import { formatPrice } from "@/lib/utils";
import type { TebexBasket, BasketPackageDetail } from "@/lib/tebex";
// import { updateCartItemQuantity, removeCartItem } from '@/actions/cart-actions'; // 추후 구현할 서버 액션
import { Loader2, Trash2 } from "lucide-react"; // 아이콘

interface CartDisplayProps {
  initialBasket: TebexBasket;
  basketIdent: string; // ident 전달받기
}

const CartDisplay = ({ initialBasket, basketIdent }: CartDisplayProps) => {
  const [basket, setBasket] = useState<TebexBasket>(initialBasket);
  const [isPending, startTransition] = useTransition(); // 서버 액션 로딩 상태
  // const { toast } = useToast(); // 임시 주석 처리

  // 수량 변경 핸들러
  const handleQuantityChange = (
    item: BasketPackageDetail,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return; // 1 미만 수량 방지

    startTransition(async () => {
      console.log(
        `Updating quantity for item ${item.in_basket.id} to ${newQuantity}`
      );
      try {
        // TODO: 실제 서버 액션 호출
        // toast({ title: "알림", description: `(임시) 상품 수량 변경 시도: ${newQuantity}개` }); // 임시 주석 처리
        alert(`(임시) 상품 수량 변경 시도: ${newQuantity}개`); // alert으로 대체
        // 임시로 클라이언트 상태 업데이트 (실제로는 액션 결과 반영)
        setBasket((prev) => ({
          ...prev,
          packages: prev.packages.map((p) =>
            p.in_basket.id === item.in_basket.id
              ? { ...p, in_basket: { ...p.in_basket, quantity: newQuantity } }
              : p
          ),
          // TODO: 총액 등도 업데이트 필요
        }));
      } catch (error) {
        console.error("Error updating quantity:", error);
        // toast({ variant: "destructive", title: "오류", description: "수량 변경 중 오류 발생" }); // 임시 주석 처리
        alert("수량 변경 중 오류 발생 (임시)"); // alert으로 대체
      }
    });
  };

  // 상품 제거 핸들러
  const handleRemoveItem = (item: BasketPackageDetail) => {
    startTransition(async () => {
      console.log(
        `Removing item ${item.id} (basket item ID: ${item.in_basket.id})`
      );
      try {
        // TODO: 실제 서버 액션 호출
        // toast({ title: "알림", description: `(임시) 상품 제거 시도: ${item.name}` }); // 임시 주석 처리
        alert(`(임시) 상품 제거 시도: ${item.name}`); // alert으로 대체
        // 임시로 클라이언트 상태 업데이트
        setBasket((prev) => ({
          ...prev,
          packages: prev.packages.filter(
            (p) => p.in_basket.id !== item.in_basket.id
          ),
          // TODO: 총액 등도 업데이트 필요
        }));
      } catch (error) {
        console.error("Error removing item:", error);
        // toast({ variant: "destructive", title: "오류", description: "상품 제거 중 오류 발생" }); // 임시 주석 처리
        alert("상품 제거 중 오류 발생 (임시)"); // alert으로 대체
      }
    });
  };

  // 결제 진행 핸들러 (Tebex 결제 링크 사용)
  const handleCheckout = () => {
    if (basket.links?.checkout) {
      window.location.href = basket.links.checkout;
    } else {
      console.error("Checkout link not available");
      // toast({ variant: "destructive", title: "오류", description: "결제를 진행할 수 없습니다." }); // 임시 주석 처리
      alert("결제를 진행할 수 없습니다. (임시)"); // alert으로 대체
    }
  };

  // 계산된 총액 (Tebex API에서 제공하는 total_price 사용)
  const totalPrice = basket.total_price || 0;
  const currency = basket.currency || "USD"; // 기본 통화

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* 장바구니 상품 목록 (왼쪽 또는 전체) */}
      <div className="lg:col-span-2 space-y-4">
        {basket.packages.map((item) => (
          <Card
            key={item.in_basket.id}
            className="flex items-center gap-4 p-4 shadow-sm relative overflow-hidden"
          >
            {/* 로딩 오버레이 */}
            {isPending && ( // TODO: 개별 아이템 로딩 상태 구분 필요
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {/* 상품 이미지 */}
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded border">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              ) : (
                <div className="h-full w-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                  이미지 없음
                </div>
              )}
            </div>
            {/* 상품 정보 및 수량/가격 */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${item.id}`}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {item.name}
                </Link>
                <span className="text-xs text-muted-foreground block">
                  개당 {formatPrice(item.in_basket.price, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Input
                  type="number"
                  min="1"
                  value={item.in_basket.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item, parseInt(e.target.value, 10))
                  }
                  className="w-16 h-9 text-center"
                  aria-label={`${item.name} 수량`}
                  disabled={isPending}
                />
                <span className="text-sm font-medium w-20 text-right">
                  {formatPrice(
                    item.in_basket.price * item.in_basket.quantity,
                    currency
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveItem(item)}
                  disabled={isPending}
                  aria-label={`${item.name} 제거`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 주문 요약 및 결제 (오른쪽) */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24 shadow-sm">
          {" "}
          {/* 스티키 적용 */}
          <CardHeader>
            <CardTitle>주문 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TODO: 쿠폰, 세금 등 추가 정보 표시 영역 */}
            <div className="flex justify-between text-lg font-semibold">
              <span>총 결제 금액</span>
              <span>{formatPrice(totalPrice, currency)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              size="lg"
              className="w-full h-12"
              onClick={handleCheckout}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              결제 진행하기
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CartDisplay;

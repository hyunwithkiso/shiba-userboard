"use client";

import { useState } from "react";
import { TebexBasket, BasketPackageDetail } from "@/lib/tebex";
import { CartItem } from "./cart-item"; // 생성 예정
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

interface CartItemsProps {
  initialBasket: TebexBasket;
}

export function CartItems({ initialBasket }: CartItemsProps) {
  // 상태를 가질 필요는 없지만, 향후 확장성을 위해 유지 (예: 클라이언트 측 필터링)
  // const [basket, setBasket] = useState<TebexBasket>(initialBasket);
  const basket = initialBasket; // 서버에서 받은 초기 데이터 사용

  // Tebex Checkout URL 가져오기 (존재하는 경우)
  const checkoutUrl = basket.links?.checkout;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {basket.packages.map((item: BasketPackageDetail) => (
          <CartItem key={item.in_basket.id} item={item} />
        ))}
      </div>

      <Separator />

      <div className="flex flex-col items-end space-y-2">
        <div className="flex justify-between w-full md:w-1/3 lg:w-1/4">
          <span className="text-muted-foreground">소계</span>
          <span className="font-medium">
            {new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: basket.currency,
            }).format(basket.base_price)}
          </span>
        </div>
        {/* 세금 표시 (API 응답에 따라 조건부 렌더링) */}
        {basket.sales_tax > 0 && (
          <div className="flex justify-between w-full md:w-1/3 lg:w-1/4">
            <span className="text-muted-foreground">세금</span>
            <span className="font-medium">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: basket.currency,
              }).format(basket.sales_tax)}
            </span>
          </div>
        )}
        <div className="flex justify-between w-full md:w-1/3 lg:w-1/4 font-bold text-lg border-t pt-2">
          <span>총합계</span>
          <span>
            {new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: basket.currency,
            }).format(basket.total_price)}
          </span>
        </div>
      </div>

      {checkoutUrl ? (
        <div className="flex justify-end mt-6">
          <Button asChild size="lg">
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              결제 진행하기
            </a>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end mt-6 gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-3">
          <AlertCircle className="h-4 w-4" />
          <span>
            결제를 진행할 수 없습니다. (체크아웃 링크 누락) 관리자에게
            문의하세요.
          </span>
        </div>
      )}
    </div>
  );
}

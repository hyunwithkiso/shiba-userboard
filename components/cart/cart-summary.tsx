"use client";

import { useState } from "react";
import { TebexBasket } from "@/lib/tebex";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CartSummaryProps {
  basket: TebexBasket;
  showCheckoutButton?: boolean;
  className?: string;
}

export function CartSummary({
  basket,
  showCheckoutButton = true,
  className = "",
}: CartSummaryProps) {
  // Tebex Checkout URL 가져오기 (존재하는 경우)
  const checkoutUrl = basket.links?.checkout;

  // 아이템 개수 계산
  const itemCount = basket.packages.reduce((count, item) => {
    return count + (item.in_basket?.quantity || 0);
  }, 0);

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">장바구니 요약</h3>
        <span className="text-sm text-muted-foreground">
          {itemCount}개 상품
        </span>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">소계</span>
          <span className="font-medium">
            {new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: basket.currency,
            }).format(basket.base_price)}
          </span>
        </div>

        {basket.sales_tax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">세금</span>
            <span className="font-medium">
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: basket.currency,
              }).format(basket.sales_tax)}
            </span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <span>총합계</span>
          <span>
            {new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: basket.currency,
            }).format(basket.total_price)}
          </span>
        </div>
      </div>

      {showCheckoutButton && (
        <div className="mt-4 space-y-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/cart">장바구니 보기</Link>
          </Button>

          {checkoutUrl ? (
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                결제 진행하기
              </a>
            </Button>
          ) : (
            <div className="flex items-center mt-2 gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>결제를 진행할 수 없습니다. 관리자에게 문의하세요.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

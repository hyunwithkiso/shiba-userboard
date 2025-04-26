"use client";

import { useState } from "react";
import { TebexBasket, BasketPackageDetail } from "@/lib/tebex";
import { CartItem } from "./cart-item"; // 카트 아이템 컴포넌트
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ShoppingBag } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CartItemsProps {
  initialBasket: TebexBasket;
}

export function CartItems({ initialBasket }: CartItemsProps) {
  // 상태를 가질 필요는 없지만, 향후 확장성을 위해 유지 (예: 클라이언트 측 필터링)
  // const [basket, setBasket] = useState<TebexBasket>(initialBasket);
  const basket = initialBasket; // 서버에서 받은 초기 데이터 사용

  // Tebex Checkout URL 가져오기 (존재하는 경우)
  const checkoutUrl = basket.links?.checkout;

  // 총 상품 개수 계산
  const totalItems = basket.packages.reduce(
    (count, item) => count + item.in_basket.quantity,
    0
  );

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* 장바구니 아이템 목록 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <h2 className="text-lg font-medium">상품 목록 ({totalItems}개)</h2>
        </div>

        <div className="space-y-4">
          {basket.packages.map((item: BasketPackageDetail) => (
            <CartItem key={item.in_basket.id} item={item} />
          ))}
        </div>
      </div>

      {/* 주문 요약 및 결제 (오른쪽) */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg gap-2">
              <ShoppingBag className="h-5 w-5" />
              <span>주문 요약</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">소계</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: basket.currency || "USD",
                  }).format(basket.base_price)}
                </span>
              </div>

              {/* 세금 표시 (API 응답에 따라 조건부 렌더링) */}
              {basket.sales_tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">세금</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: basket.currency || "USD",
                    }).format(basket.sales_tax)}
                  </span>
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between font-bold text-lg">
                <span>총합계</span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: basket.currency || "USD",
                  }).format(basket.total_price)}
                </span>
              </div>
            </div>

            {/* 쿠폰 코드 입력 (향후 구현) */}
            {/* <div className="pt-2">
              <p className="text-sm font-medium mb-2">쿠폰 코드</p>
              <div className="flex gap-2">
                <Input placeholder="쿠폰 코드 입력" className="flex-1" />
                <Button variant="outline">적용</Button>
              </div>
            </div> */}
          </CardContent>
          <CardFooter>
            {checkoutUrl ? (
              <Button asChild size="lg" className="w-full">
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  결제 진행하기
                </a>
              </Button>
            ) : (
              <div className="flex items-center w-full gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  결제를 진행할 수 없습니다. (체크아웃 링크 누락) 관리자에게
                  문의하세요.
                </span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

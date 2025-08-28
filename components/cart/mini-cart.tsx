"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserBasketAction } from "@/actions/basket-action";
import { TebexBasket } from "@/lib/tebex";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CartSummary } from "./cart-summary";
import { Separator } from "@/components/ui/separator";

export function MiniCart() {
  const [basket, setBasket] = useState<TebexBasket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 장바구니 아이템 총 개수
  const itemCount =
    basket?.packages?.reduce((count, item) => {
      return count + (item.in_basket?.quantity || 0);
    }, 0) || 0;

  useEffect(() => {
    async function loadBasket() {
      try {
        setLoading(true);
        const result = await getUserBasketAction(); // 이미 캐싱됨

        if (result.success && result.data) {
          setBasket(result.data);
          setError(null);
        } else {
          setError(result.error || "장바구니를 불러올 수 없습니다");
          setBasket(null);
        }
      } catch (err) {
        console.error("미니 장바구니 로딩 오류:", err);
        setError("장바구니를 불러오는 중 오류가 발생했습니다");
        setBasket(null);
      } finally {
        setLoading(false);
      }
    }

    loadBasket();
    
    // ✅ 5초마다 업데이트 (캐시된 데이터 사용으로 API 호출 최소화)
    const interval = setInterval(loadBasket, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          aria-label="장바구니"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="font-medium mb-2">장바구니</div>

        {loading ? (
          <div className="text-center p-4 text-sm text-muted-foreground">
            로딩 중...
          </div>
        ) : error ? (
          <div className="text-center p-4 text-sm text-destructive">
            {error}
          </div>
        ) : !basket || !basket.packages || basket.packages.length === 0 ? (
          <div className="text-center p-4 text-sm text-muted-foreground">
            장바구니가 비어 있습니다
          </div>
        ) : (
          <>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
              {basket.packages.slice(0, 3).map((item) => (
                <div
                  key={item.in_basket.id}
                  className="flex items-center gap-2"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="h-full w-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.in_basket.quantity}개:{" "}
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: basket.currency,
                      }).format(item.in_basket.price * item.in_basket.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {basket.packages.length > 3 && (
                <div className="text-xs text-center text-muted-foreground">
                  외 {basket.packages.length - 3}개 상품
                </div>
              )}
            </div>

            <Separator />

            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>총합계:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: basket.currency,
                  }).format(basket.total_price)}
                </span>
              </div>

              <div className="flex space-x-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href="/cart">장바구니 보기</Link>
                </Button>

                {basket.links?.checkout && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <a
                      href={basket.links.checkout}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      결제하기
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

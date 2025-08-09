"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { TebexPackage } from "@/lib/tebex"; // TebexPackage 타입 경로 확인 필요
import { formatPrice } from "@/lib/utils"; // formatPrice 경로 확인 필요
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Shadcn UI 경로 확인 필요
import { AspectRatio } from "@/components/ui/aspect-ratio"; // 이미지 비율 유지
import { getExchangeRate, convertUsdToKrw, formatKrwPrice } from "@/lib/currency";

interface ProductCardProps {
  product: TebexPackage;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { id, name, image, price, total_price, currency, category } = product;
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // 디버깅 로그 제거
  // console.log(`Product ${id} Price:`, price, total_price, currency);

  const productUrl = `/shop/${id}`;

  // 가격과 통화 결정 로직
  const displayPrice = total_price !== undefined ? total_price : price?.amount;
  const displayCurrency = currency || price?.currency;

  useEffect(() => {
    // USD 가격인 경우에만 환율 정보를 가져옴
    if (displayCurrency === 'USD' && displayPrice) {
      getExchangeRate().then(setExchangeRate).catch(() => {
        console.warn('환율 정보를 가져오는데 실패했습니다.');
      });
    }
  }, [displayCurrency, displayPrice]);

  return (
    <Link
      href={productUrl}
      aria-label={`${name} 상세 보기`}
      className="block group h-full"
    >
      <Card
        className="flex flex-col h-full overflow-hidden rounded-lg border shadow-sm transition-shadow group-hover:shadow-md bg-card"
        aria-labelledby={`product-title-${id}`}
      >
        <CardHeader className="p-0 relative">
          {/* 이미지 영역: AspectRatio로 비율 유지 */}
          <AspectRatio ratio={16 / 9}>
            {/* 이미지 클릭을 위한 Link는 유지 */}
            {image ? (
              <Image
                src={image}
                alt={`${name} 상품 이미지`}
                fill // 부모 요소(AspectRatio 내부)를 채우도록 설정
                className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-105" // 호버 시 약간 확대
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // 반응형 이미지 크기 최적화
                priority={false} // 중요도 낮은 이미지 (필요시 true로 변경)
              />
            ) : (
              // 이미지가 없을 경우 Placeholder
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <span className="text-sm">이미지 없음</span>
              </div>
            )}
          </AspectRatio>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between p-3">
          <div>
            {/* 상품명 */}
            <CardTitle
              id={`product-title-${id}`}
              className="mb-1 text-base font-medium leading-tight line-clamp-2 group-hover:underline"
            >
              {name}
            </CardTitle>
          </div>
          <div className="flex items-center justify-between mt-2">
            {/* 가격 */}
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">
                {formatPrice(displayPrice, displayCurrency)}
              </span>
              {/* 한화 가격 표시 (USD인 경우에만) */}
              {displayCurrency === 'USD' && exchangeRate && displayPrice && (
                <span className="text-sm text-muted-foreground">
                  {formatKrwPrice(convertUsdToKrw(displayPrice, exchangeRate))}
                </span>
              )}
            </div>
            {/* 카테고리 */}
            {category?.name && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {category.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;

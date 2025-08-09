"use client";

import { formatPrice } from "@/lib/utils";
import { formatKrwPrice, convertUsdToKrw } from "@/lib/currency";

interface PriceDisplayProps {
  price?: number;
  currency?: string;
  exchangeRate?: number;
  className?: string;
  showKrwPrice?: boolean;
}

export default function PriceDisplay({ 
  price, 
  currency, 
  exchangeRate, 
  className = "",
  showKrwPrice = true 
}: PriceDisplayProps) {
  if (!price || !currency) {
    return null;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-4xl font-bold text-primary">
        {formatPrice(price, currency)}
      </span>
      {/* 한화 가격 표시 (USD이고 환율 정보가 있을 때만) */}
      {showKrwPrice && currency === 'USD' && exchangeRate && (
        <span className="text-lg text-muted-foreground mt-1">
          {formatKrwPrice(convertUsdToKrw(price, exchangeRate))}
        </span>
      )}
    </div>
  );
}
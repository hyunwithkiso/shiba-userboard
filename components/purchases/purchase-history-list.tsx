"use client";

import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ShoppingBag,
  CreditCard,
  Tag,
  PackageCheck,
  Calendar,
  Wallet,
} from "lucide-react";
import { PurchaseHistoryItem } from "@/app/purchases/page";

interface PurchaseHistoryListProps {
  purchaseHistory: PurchaseHistoryItem[];
}

// 한국어 날짜 포맷 함수
function formatKoreanDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// 거래 ID 포맷 함수 (짧은 형태로 표시)
function formatTransactionId(id: number | null | undefined): string {
  if (!id) return "-";
  return `#${id}`;
}

// 구매 상태 변환 함수 (한글)
function getStatusText(status: string): string {
  switch (status) {
    case "completed":
      return "완료";
    case "pending":
      return "처리중";
    case "failed":
      return "실패";
    default:
      return status;
  }
}

// 구매 상태 배지 색상
function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export function PurchaseHistoryList({
  purchaseHistory,
}: PurchaseHistoryListProps) {
  return (
    <div className="space-y-6">
      {purchaseHistory.map((purchase) => {
        // items가 배열인지 확인하고, 아니면 빈 배열로 처리
        const itemsArray = Array.isArray(purchase.items) ? purchase.items : [];

        return (
          <Card key={purchase.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(purchase.status)}>
                    {getStatusText(purchase.status)}
                  </Badge>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {formatKoreanDate(purchase.purchasedAt).split(" ")[0]}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatKoreanDate(purchase.purchasedAt)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  {purchase.tebexTransactionId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs flex items-center">
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            거래 ID:{" "}
                            {formatTransactionId(purchase.tebexTransactionId)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>트랜잭션 ID: {purchase.tebexTransactionId}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {purchase.basketIdent && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs flex items-center">
                            <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                            장바구니: {purchase.basketIdent.slice(0, 8)}...
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>장바구니 ID: {purchase.basketIdent}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Tag className="h-4 w-4" /> 구매 상품
                  </h3>
                  <ul className="space-y-2">
                    {itemsArray.length > 0 ? (
                      itemsArray.map((item: any, index: number) => (
                        <li
                          key={index}
                          className="text-sm p-2 rounded-md flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {item.image && (
                              <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
                                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">
                              {item.name || "알 수 없는 상품"}
                              {item.quantity > 1 && ` x ${item.quantity}`}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {formatPrice(
                              item.price ? item.price / 100 : 0,
                              purchase.currency
                            )}
                          </span>
                        </li>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm italic">
                        상품 정보 없음
                      </div>
                    )}
                  </ul>
                </div>

                <div className="border-t sm:border-l sm:border-t-0 pt-3 sm:pt-0 sm:pl-4 flex sm:flex-col justify-between sm:justify-start gap-2">
                  <div>
                    <h4 className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> 결제 금액
                    </h4>
                    <div className="text-lg font-bold">
                      {formatPrice(
                        purchase.totalAmount ? purchase.totalAmount / 100 : 0,
                        purchase.currency
                      )}
                    </div>
                  </div>

                  {purchase.couponCode && (
                    <div className="text-xs text-muted-foreground">
                      쿠폰:{" "}
                      <span className="font-medium">{purchase.couponCode}</span>
                    </div>
                  )}

                  {purchase.creatorCode && (
                    <div className="text-xs text-muted-foreground">
                      크리에이터:{" "}
                      <span className="font-medium">
                        {purchase.creatorCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="py-2 text-xs text-muted-foreground flex justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors px-1 py-0.5 rounded border border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    aria-label="주문 ID 복사"
                    tabIndex={0}
                    onClick={async () => {
                      await navigator.clipboard.writeText(purchase.id);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        await navigator.clipboard.writeText(purchase.id);
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 16 16"
                      stroke="currentColor"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="8"
                        height="8"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <rect
                        x="2.5"
                        y="2.5"
                        width="8"
                        height="8"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        opacity="0.4"
                      />
                    </svg>
                    주문 ID: {purchase.id}
                  </button>
                </TooltipTrigger>
                <TooltipContent>클릭 시 복사</TooltipContent>
              </Tooltip>

              {purchase.paymentMethod && (
                <span>결제 방법: {purchase.paymentMethod}</span>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

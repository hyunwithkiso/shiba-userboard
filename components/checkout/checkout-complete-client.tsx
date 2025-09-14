"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPurchaseFromCheckout } from "@/actions/payment-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Hourglass,
  ShoppingBag,
  Package,
  ArrowRight,
} from "lucide-react";

// 상태를 나타내는 enum
enum CheckoutStatus { LOADING, SUCCESS, ERROR, INVALID }

// 장바구니/Checkout API 호출 금지: DB 구매내역만 조회

// 클라이언트 컴포넌트 인터페이스 정의
interface CheckoutCompleteClientProps { basketIdent: string; txn_id?: string }

export function CheckoutCompleteClient({ basketIdent, txn_id }: CheckoutCompleteClientProps) {
  const searchParams = useSearchParams();
  const transactionId = txn_id || searchParams.get("txn_id");

  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<any | null>(null);

  useEffect(() => {
    if (!transactionId) { setErrorMessage("거래 ID가 없습니다."); setStatus(CheckoutStatus.INVALID); return; }
    if (!basketIdent) { setErrorMessage("장바구니 ID가 없습니다."); setStatus(CheckoutStatus.INVALID); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await createPurchaseFromCheckout(basketIdent, String(transactionId));
        if (!cancelled) {
          if (res.success && res.purchase) {
            const p = (res.purchase as any)?.items ? res.purchase : (res.purchase as any)?.purchase ?? null;
            if (p) setPurchase(p);
            setStatus(CheckoutStatus.SUCCESS);
          } else if (res.success) {
            // 성공이지만 요약이 없는 경우(드문 케이스)
            setStatus(CheckoutStatus.SUCCESS);
          } else {
            const msg = res.error || "";
            if (/already/i.test(msg) || /이미/.test(msg)) {
              // 이미 처리된 주문으로 간주하고 성공 화면으로 안내
              setStatus(CheckoutStatus.SUCCESS);
            } else {
              setErrorMessage(res.error || "구매 내역을 생성하지 못했습니다.");
              setStatus(CheckoutStatus.ERROR);
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setErrorMessage(e?.message || "구매 내역 생성 중 오류가 발생했습니다.");
          setStatus(CheckoutStatus.ERROR);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [basketIdent, transactionId]);

  // 상태에 따른 UI 렌더링
  const renderStatus = () => {
    switch (status) {
      case CheckoutStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Hourglass className="h-16 w-16 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-semibold mb-2">결제 처리 중...</h1>
            <p className="text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        );
      case CheckoutStatus.SUCCESS:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-3">
              결제가 성공적으로 완료되었습니다!
            </h1>
            {purchase ? (
              <div className="text-sm text-left bg-muted/30 rounded-lg p-4 my-4 w-full max-w-xl">
                <div className="font-semibold mb-2">주문 요약</div>
                <ul className="space-y-1">
                  {Array.isArray(purchase.items) && purchase.items.length > 0 ? (
                    purchase.items.map((it: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>{it.name || '상품'} x {it.quantity || 1}</span>
                        <span>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: purchase.currency || 'USD' }).format((it.totalPrice ?? it.price ?? 0) / 100)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">상품 정보가 없습니다.</li>
                  )}
                </ul>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>총 합계</span>
                  <span>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: purchase.currency || 'USD' }).format((purchase.totalAmount ?? 0)/100)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground mb-8 max-w-md">
                구매해 주셔서 감사합니다. 구매 내역에서 자세한 정보를 확인하실 수 있습니다.
              </p>
            )}
            <div className="flex gap-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/shop">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  상점으로 돌아가기
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-primary/90 hover:bg-primary"
              >
                <Link href="/purchases">
                  <Package className="mr-2 h-4 w-4" />
                  구매 내역 확인하기
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        );
      case CheckoutStatus.ERROR:
      case CheckoutStatus.INVALID:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-3">
              {status === CheckoutStatus.INVALID ? "잘못된 요청" : "오류가 발생했습니다"}
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              {errorMessage ||
                (status === CheckoutStatus.INVALID ? "거래 ID가 없습니다." : "구매 내역을 찾을 수 없습니다.")}
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                상점으로 돌아가기
              </Link>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return renderStatus();
}

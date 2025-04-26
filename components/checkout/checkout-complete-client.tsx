"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createPurchaseFromCheckout,
  resetUserBasketAction,
  getBasketAction,
} from "@/actions/payment-actions";
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
enum CheckoutStatus {
  LOADING,
  SUCCESS,
  ALREADY_PROCESSED,
  PENDING,
  ERROR,
  INVALID_BASKET,
}

// Tebex 장바구니 응답 타입 정의
interface TebexBasketDetails {
  complete?: boolean;
  links?: {
    payment?: string[];
    [key: string]: any;
  };
  id?: number;
  ident?: string;
  transaction_id?: string;
  [key: string]: any;
}

// 클라이언트 컴포넌트 인터페이스 정의
interface CheckoutCompleteClientProps {
  basketIdent: string;
  txn_id?: string;
}

export function CheckoutCompleteClient({
  basketIdent,
  txn_id,
}: CheckoutCompleteClientProps) {
  const searchParams = useSearchParams();
  const transactionId = txn_id || searchParams.get("txn_id");

  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!basketIdent) {
      console.error("Basket identifier not provided.");
      setErrorMessage("결제 정보를 찾을 수 없습니다.");
      setStatus(CheckoutStatus.INVALID_BASKET);
      return;
    }

    console.log(
      `[Client] Processing checkout for basket: ${basketIdent}, transaction_id: ${
        transactionId || "N/A"
      }`
    );

    const processCheckout = async () => {
      setStatus(CheckoutStatus.LOADING);
      setErrorMessage(null);

      try {
        // 1. Tebex API 호출하여 결제 상태 확인 (fetchTebexCheckoutApi 대신 getBasketAction 사용)
        console.log(`[${basketIdent}] Getting basket data...`);
        const basketResult = await getBasketAction(basketIdent);

        if (!basketResult.success) {
          throw new Error(
            basketResult.error || "장바구니 정보를 가져오는데 실패했습니다."
          );
        }

        const basketDetails: TebexBasketDetails = basketResult.data;
        console.log(`[${basketIdent}] Basket data:`, basketDetails);

        // 결제 완료 여부 확인
        const isPaymentComplete =
          basketDetails?.complete === true ||
          (basketDetails?.links?.payment &&
            basketDetails.links.payment.length > 0);

        if (isPaymentComplete) {
          console.log(
            `[${basketIdent}] Payment confirmed. Creating purchase record...`
          );

          // transactionId 확인 (URL 파라미터 또는 API 응답에서 가져옴)
          const finalTransactionId =
            transactionId || basketDetails.transaction_id;

          if (finalTransactionId) {
            console.log(
              `[${basketIdent}] Using transaction ID: ${finalTransactionId}`
            );
          } else {
            console.log(`[${basketIdent}] No transaction ID available.`);
          }

          // 2. 결제 완료 시, 서버 액션 호출하여 Purchase 생성
          const result = await createPurchaseFromCheckout(
            basketIdent,
            finalTransactionId || undefined
          );
          console.log(`[${basketIdent}] Server Action Response:`, result);

          // 3. 성공적으로 처리된 경우 basketIdent를 null로 리셋
          if (result.success) {
            console.log(
              `[${basketIdent}] Purchase created successfully. Resetting basket ident...`
            );
            await resetUserBasketAction();
            console.log(`[${basketIdent}] Basket ident reset completed.`);
            setStatus(CheckoutStatus.SUCCESS);
          } else {
            // 이미 처리된 구매인 경우도 basketIdent 리셋
            if (result.error?.includes("already been recorded")) {
              console.warn(
                `[${basketIdent}] Purchase already processed. Resetting basket ident...`
              );
              await resetUserBasketAction();
              console.log(`[${basketIdent}] Basket ident reset completed.`);
              setStatus(CheckoutStatus.ALREADY_PROCESSED);
            } else {
              console.error(
                `[${basketIdent}] Failed to create purchase:`,
                result.error
              );
              setErrorMessage(
                result.error || "구매 기록 생성 중 오류가 발생했습니다."
              );
              setStatus(CheckoutStatus.ERROR);
            }
          }
        } else {
          // 결제가 아직 완료되지 않은 경우
          console.warn(`[${basketIdent}] Payment pending or not completed.`);
          setStatus(CheckoutStatus.PENDING);
        }
      } catch (error: unknown) {
        console.error(`[${basketIdent}] Error processing checkout:`, error);
        const message =
          error instanceof Error
            ? error.message
            : "결제 상태 확인 중 알 수 없는 오류가 발생했습니다.";

        // 오류 유형에 따른 처리
        if (
          message.includes("404") ||
          message.toLowerCase().includes("not found")
        ) {
          setErrorMessage(
            "유효하지 않은 결제 ID입니다. URL을 다시 확인해주세요."
          );
          setStatus(CheckoutStatus.INVALID_BASKET);
        } else if (
          message.includes("401") ||
          message.toLowerCase().includes("unauthorized")
        ) {
          setErrorMessage("API 인증에 실패했습니다. 서버 설정을 확인해주세요.");
          setStatus(CheckoutStatus.ERROR);
        } else {
          setErrorMessage(message);
          setStatus(CheckoutStatus.ERROR);
        }
      }
    };

    processCheckout();
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
      case CheckoutStatus.ALREADY_PROCESSED:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-3">
              결제가 성공적으로 완료되었습니다!
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              구매해 주셔서 감사합니다. 구매 내역에서 자세한 정보를 확인하실 수
              있습니다.
            </p>
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
      case CheckoutStatus.PENDING:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <Hourglass className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-600 mb-3">
              결제 진행 중
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              결제가 아직 처리 중입니다. 잠시 후 다시 확인해 주세요.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                상점으로 돌아가기
              </Link>
            </Button>
          </div>
        );
      case CheckoutStatus.ERROR:
      case CheckoutStatus.INVALID_BASKET:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-3">
              오류가 발생했습니다
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              {errorMessage ||
                "결제 처리 중 문제가 발생했습니다. 다시 시도해 주세요."}
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

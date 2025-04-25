"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchTebexCheckoutApi } from "@/lib/tebex"; // 이 함수는 1단계에서 생성했습니다.
import { createPurchaseFromCheckout } from "@/actions/payment-actions"; // 이 함수는 2단계에서 생성했습니다.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Terminal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hourglass,
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

// Tebex Checkout API 응답 타입을 정의합니다.
// 필요한 최소한의 속성만 포함하거나, API 문서를 참고하여 더 정확하게 정의할 수 있습니다.
interface TebexBasketDetails {
  complete?: boolean;
  links?: {
    payment?: string[];
    [key: string]: any; // 다른 링크 속성이 있을 수 있음
  };
  id?: number;
  ident?: string;
  // 필요한 다른 속성 추가
  [key: string]: any; // API 응답에 예기치 않은 다른 속성이 있을 수 있음
}

// Suspense 내부에서 searchParams를 읽기 위한 컴포넌트
function CheckoutCompleteContent() {
  const searchParams = useSearchParams();
  const basketIdent = searchParams.get("basket_ident"); // Tebex에서 basket_ident 파라미터를 사용합니다.

  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // basketIdent가 없으면 처리 중단
    if (!basketIdent) {
      console.error("Basket identifier not found in query parameters.");
      setErrorMessage(
        "결제 정보를 찾을 수 없습니다. basket_ident가 URL에 포함되어 있는지 확인해주세요."
      );
      setStatus(CheckoutStatus.INVALID_BASKET);
      return;
    }

    console.log(`Processing checkout completion for basket: ${basketIdent}`);

    const processCheckout = async () => {
      setStatus(CheckoutStatus.LOADING);
      setErrorMessage(null);

      try {
        // 1. Tebex Checkout API 호출하여 결제 상태 확인 (타입 적용)
        console.log(`[${basketIdent}] Calling Tebex Checkout API...`);
        const basketDetails: TebexBasketDetails = await fetchTebexCheckoutApi(
          `/baskets/${basketIdent}`
        );
        console.log(
          `[${basketIdent}] Tebex Checkout API Response:`,
          basketDetails
        );

        // 결제 완료 여부 확인 (complete 플래그 또는 links.payment 존재 여부)
        const isPaymentComplete =
          basketDetails?.complete === true ||
          (basketDetails?.links?.payment &&
            basketDetails.links.payment.length > 0);
        // const isPaymentComplete = basketDetails?.complete === true; // complete 플래그만 사용할 경우

        if (isPaymentComplete) {
          console.log(
            `[${basketIdent}] Payment confirmed by Tebex. Attempting to create purchase record...`
          );
          // 2. 결제 완료 시, 서버 액션 호출하여 Purchase 생성
          const result = await createPurchaseFromCheckout(basketIdent);
          console.log(`[${basketIdent}] Server Action Response:`, result);

          if (result.success) {
            console.log(
              `[${basketIdent}] Purchase record created successfully.`
            );
            setStatus(CheckoutStatus.SUCCESS);
          } else {
            // 서버 액션에서 반환된 에러 메시지 확인 (예: 이미 처리된 구매)
            if (result.error?.includes("already been recorded")) {
              console.warn(`[${basketIdent}] Purchase already processed.`);
              setStatus(CheckoutStatus.ALREADY_PROCESSED);
            } else {
              console.error(
                `[${basketIdent}] Failed to create purchase record:`,
                result.error
              );
              setErrorMessage(
                result.error || "구매 기록 생성 중 오류가 발생했습니다."
              );
              setStatus(CheckoutStatus.ERROR);
            }
          }
        } else {
          // 결제가 아직 완료되지 않은 경우 (예: 은행 송금 대기)
          console.warn(
            `[${basketIdent}] Payment pending or not completed according to Tebex.`
          );
          setStatus(CheckoutStatus.PENDING);
        }
      } catch (error: unknown) {
        console.error(`[${basketIdent}] Error processing checkout:`, error);
        const message =
          error instanceof Error
            ? error.message
            : "결제 상태 확인 중 알 수 없는 오류가 발생했습니다.";

        // 404 에러는 basketIdent가 잘못되었을 가능성이 높음
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
          setErrorMessage(
            "Tebex API 인증에 실패했습니다. 서버 설정을 확인해주세요."
          );
          setStatus(CheckoutStatus.ERROR);
        } else {
          setErrorMessage(message);
          setStatus(CheckoutStatus.ERROR);
        }
      }
    };

    processCheckout();
  }, [basketIdent]); // basketIdent가 변경될 때만 실행

  // 상태에 따른 UI 렌더링
  const renderStatus = () => {
    switch (status) {
      case CheckoutStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Hourglass className="h-16 w-16 animate-spin text-primary" />
            <p className="text-lg font-semibold">
              결제 상태를 확인 중입니다...
            </p>
            <p className="text-muted-foreground text-sm">
              잠시만 기다려주세요.
            </p>
          </div>
        );
      case CheckoutStatus.SUCCESS:
        return (
          <Alert
            variant="default"
            className="bg-green-50 border-green-200 text-green-800"
          >
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="font-bold">결제 완료!</AlertTitle>
            <AlertDescription>
              결제가 성공적으로 처리되었으며, 구매 내역이 기록되었습니다.
              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/shop">상점으로 돌아가기</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/my-purchases">내 구매 내역 보기</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      case CheckoutStatus.ALREADY_PROCESSED:
        return (
          <Alert
            variant="default"
            className="bg-blue-50 border-blue-200 text-blue-800"
          >
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <AlertTitle className="font-bold">이미 처리된 결제</AlertTitle>
            <AlertDescription>
              이 결제는 이미 처리되어 구매 내역에 기록되었습니다.
              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/shop">상점으로 돌아가기</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/my-purchases">내 구매 내역 보기</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      case CheckoutStatus.PENDING:
        return (
          <Alert
            variant="default"
            className="bg-yellow-50 border-yellow-200 text-yellow-800"
          >
            <Hourglass className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="font-bold">결제 대기 중</AlertTitle>
            <AlertDescription>
              결제가 아직 완료되지 않았습니다. 결제가 완료되면 자동으로
              처리됩니다.
              <p className="mt-2 text-sm">
                문제가 지속되면 관리자에게 문의해주세요.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/shop">상점으로 돌아가기</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      case CheckoutStatus.ERROR:
      case CheckoutStatus.INVALID_BASKET:
        return (
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">오류 발생</AlertTitle>
            <AlertDescription>
              {errorMessage || "결제 처리 중 오류가 발생했습니다."}
              <p className="mt-2 text-sm">
                문제가 지속되면 관리자에게 문의해주세요.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/shop">상점으로 돌아가기</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg text-card-foreground">
        {renderStatus()}
      </div>
    </div>
  );
}

// 페이지 컴포넌트
export default function CheckoutCompletePage() {
  // Suspense로 useSearchParams를 사용하는 컴포넌트를 감쌉니다.
  // 페이지 전체가 클라이언트 컴포넌트가 되는 것을 방지하고 로딩 상태를 더 잘 처리할 수 있습니다.
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Hourglass className="h-16 w-16 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  );
}

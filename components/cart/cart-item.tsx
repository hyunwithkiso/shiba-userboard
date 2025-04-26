"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { BasketPackageDetail } from "@/lib/tebex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle as CheckIconLucide,
} from "lucide-react";
import {
  updateCartItemQuantityAction,
  removeCartItemAction,
} from "@/actions/cart-actions"; // 서버 액션 임포트
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Alert 관련 컴포넌트 임포트

interface CartItemProps {
  item: BasketPackageDetail;
}

export function CartItem({ item }: CartItemProps) {
  const [quantity, setQuantity] = useState<number>(item.in_basket.quantity);
  const [isPending, startTransition] = useTransition();

  // Alert 상태 추가
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<
    "default" | "destructive" | "success" | null
  >(null);

  // Alert 자동 숨김 처리
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
        setAlertVariant(null);
      }, 4000); // 4초 후 숨김
      return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 제거
    }
  }, [alertMessage]);

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // 숫자 또는 빈 문자열만 허용, 최소 1
    const newQuantity = value === "" ? 1 : parseInt(value, 10); // 빈 문자열이면 임시로 1
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      setQuantity(newQuantity);
    } else if (value === "") {
      setQuantity(1); // 또는 빈 입력 허용 후 유효성 검사 강화
    }
  };

  const handleUpdateQuantity = () => {
    setAlertMessage(null); // 이전 알림 숨기기
    setAlertVariant(null);

    if (quantity === item.in_basket.quantity) {
      setAlertVariant("default");
      setAlertMessage("수량이 변경되지 않았습니다.");
      return;
    }
    if (quantity < 1) {
      setAlertVariant("destructive");
      setAlertMessage("수량은 1 이상이어야 합니다.");
      return;
    }

    startTransition(async () => {
      const result = await updateCartItemQuantityAction(item.id, quantity);
      if (result.success) {
        setAlertVariant("success");
        setAlertMessage(
          `"${item.name}" 상품의 수량이 ${quantity}개로 변경되었습니다.`
        );
      } else {
        setAlertVariant("destructive");
        setAlertMessage(result.error || "수량 변경 중 오류가 발생했습니다.");
        setQuantity(item.in_basket.quantity);
      }
    });
  };

  const handleRemoveItem = () => {
    setAlertMessage(null); // 이전 알림 숨기기
    setAlertVariant(null);

    startTransition(async () => {
      const result = await removeCartItemAction(item.id);
      if (result.success) {
        setAlertVariant("success");
        setAlertMessage(`"${item.name}" 상품이 장바구니에서 삭제되었습니다.`);
      } else {
        setAlertVariant("destructive");
        setAlertMessage(result.error || "상품 삭제 중 오류가 발생했습니다.");
      }
    });
  };

  // Alert 아이콘 및 스타일 결정
  const getAlertIcon = () => {
    switch (alertVariant) {
      case "success":
        return <CheckIconLucide className="h-4 w-4" />;
      case "destructive":
        return <AlertCircle className="h-4 w-4" />;
      case "default":
        return <AlertCircle className="h-4 w-4" />; // 정보성 알림에도 아이콘 표시
      default:
        return null;
    }
  };

  const getAlertClasses = () => {
    switch (alertVariant) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "destructive":
        return "bg-red-50 border-red-200 text-red-800"; // destructive 기본 스타일 사용 가능
      case "default":
        return "bg-blue-50 border-blue-200 text-blue-800"; // 정보성 스타일
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col rounded-lg border p-4 gap-4 relative">
      {" "}
      {/* Alert 표시 공간 확보 위해 relative */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* 상품 정보 */}
        <div className="flex items-center space-x-4 flex-grow">
          <Image
            src={item.image || "/placeholder-image.png"} // 기본 이미지 경로 설정
            alt={item.name}
            width={64}
            height={64}
            className="rounded object-cover aspect-square"
          />
          <div className="flex-grow">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: item.currency || "USD",
              }).format(item.in_basket.price)}{" "}
              / 개
            </p>
          </div>
        </div>

        {/* 수량 변경 및 삭제 */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* 수량 입력 필드 */}
          <Input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            className="w-16 h-10 text-center"
            aria-label={`${item.name} 수량`}
            disabled={isPending}
          />
          {/* 업데이트 버튼 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleUpdateQuantity}
            disabled={isPending || quantity === item.in_basket.quantity}
            aria-label={`${item.name} 수량 업데이트`}
            className="h-10 w-10" // 크기 고정
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </Button>
          {/* 삭제 버튼 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRemoveItem}
            disabled={isPending}
            aria-label={`${item.name} 삭제`}
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-10 w-10" // 크기 고정
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 개별 아이템 합계 */}
        <div className="w-full sm:w-auto text-right font-medium pt-2 sm:pt-0 border-t sm:border-none mt-2 sm:mt-0 sm:ml-4">
          {" "}
          {/* 오른쪽 정렬 및 간격 조정 */}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: item.currency || "USD",
          }).format(item.in_basket.price * item.in_basket.quantity)}
        </div>
      </div>
      {/* Alert 표시 영역 */}
      {alertMessage && (
        <div className="mt-2 w-full">
          {" "}
          {/* 아이템 하단에 표시 */}
          <Alert
            className={`py-2 px-3 text-sm flex items-center gap-2 ${getAlertClasses()}`}
          >
            {getAlertIcon()}
            {/* <AlertTitle>알림</AlertTitle> */}
            <AlertDescription className="m-0">{alertMessage}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

// 임시 CheckIcon (lucide-react에 없을 경우)
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { addCartItemAction } from "@/actions/cart-actions";
import { ShoppingCart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AddToCartButtonProps {
  packageId: number;
  packageName: string; // 토스트 메시지에 사용
}

export function AddToCartButton({
  packageId,
  packageName,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<
    "destructive" | "success" | null
  >(null);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
        setAlertVariant(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const handleAddToCart = () => {
    setAlertMessage(null);
    setAlertVariant(null);

    startTransition(async () => {
      const result = await addCartItemAction(packageId, 1);
      if (result.success) {
        setAlertVariant("success");
        setAlertMessage(`"${packageName}" 상품이 장바구니에 추가되었습니다.`);
      } else {
        setAlertVariant("destructive");
        setAlertMessage(
          result.error || "장바구니 추가 중 오류가 발생했습니다."
        );
      }
    });
  };

  const getAlertIcon = () => {
    switch (alertVariant) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "destructive":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getAlertClasses = () => {
    switch (alertVariant) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "destructive":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full md:w-auto">
      <Button
        onClick={handleAddToCart}
        disabled={isPending}
        size="lg"
        className="w-full md:w-auto"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        {isPending ? "추가 중..." : "장바구니에 추가"}
      </Button>

      {alertMessage && (
        <div className="w-full">
          <Alert
            className={`py-2 px-3 text-sm flex items-center gap-2 ${getAlertClasses()}`}
          >
            {getAlertIcon()}
            <AlertDescription className="m-0">{alertMessage}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

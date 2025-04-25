"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { resetUserBasketAction } from "@/actions/payment-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation"; // Import useRouter

interface ResetBasketButtonProps {
  className?: string;
}

export function ResetBasketButton({ className }: ResetBasketButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter(); // Initialize useRouter

  const handleReset = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await resetUserBasketAction();
      if (result.success) {
        setSuccess(true);
        // Optionally redirect or refresh after success
        router.refresh(); // Refresh current page to reflect changes if needed
        // router.push('/cart'); // Or redirect to cart page
        console.log("Basket reset successfully!");
        // You might want to disable the button after success or hide it
      } else {
        setError(result.error || "장바구니 초기화 실패");
      }
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button onClick={handleReset} disabled={isPending || success}>
        {" "}
        {/* Disable button on success too */}
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : success ? (
          <RefreshCw className="mr-2 h-4 w-4" /> // Or Check icon
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {isPending
          ? "처리 중..."
          : success
          ? "장바구니 초기화됨"
          : "새 장바구니 시작하기"}
      </Button>
      {error && (
        <Alert variant="destructive" className="p-2 text-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Optional success message 
             {success && (
                 <Alert variant="success" className="p-2 text-xs">
                     <AlertDescription>새로운 장바구니가 준비되었습니다.</AlertDescription>
                 </Alert>
             )} */}
    </div>
  );
}

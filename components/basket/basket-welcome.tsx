"use client";

import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { logoutBasketAndRedirectAction } from "@/actions/basket-logout-action";
import { toast } from "sonner";

interface BasketWelcomeProps {
  basketUsername: string;
}

export function BasketWelcome({ basketUsername }: BasketWelcomeProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // 로그아웃 토스트 메시지 표시
      toast.info("장바구니에서 로그아웃 중입니다...");
      
      // Server Action 호출 (자동으로 리다이렉트됨)
      await logoutBasketAndRedirectAction();
      
      // 이 코드는 리다이렉트로 인해 실행되지 않을 수 있음
      toast.success("장바구니에서 로그아웃되었습니다.");
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  return (
    <Alert
      variant="default"
      className="mb-6 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
    >
      <CheckCircle2 className="h-4 w-4 stroke-current" />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="font-semibold">
            환영합니다, {basketUsername}님!
          </AlertTitle>
          <AlertDescription>
            상점 이용이 가능합니다. 원하시는 상품을 둘러보세요.
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800/50"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그아웃 중...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
}

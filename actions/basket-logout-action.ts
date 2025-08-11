"use server";

import { auth } from "@/lib/auth";
import { basketService } from "@/services/basket-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * 사용자의 basketIdent를 초기화(로그아웃)하고 상점 페이지를 새로고침합니다.
 * 이 액션을 실행하면 다음 상점 접속 시 새로운 장바구니가 생성됩니다.
 * @returns 작업 결과
 */
export async function logoutBasketAction(): Promise<ActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "사용자 인증이 필요합니다." };
    }

    console.log(
      `[Action:logoutBasket] Logging out basket for user ${userId}`
    );

    // BasketService의 logoutBasket 호출
    const result = await basketService.logoutBasket();

    if (!result.success) {
      console.error(
        `[Action:logoutBasket] Failed to logout basket for user ${userId}:`,
        result.error
      );
      return {
        success: false,
        error: result.error || "장바구니 로그아웃 중 오류가 발생했습니다.",
      };
    }

    console.log(
      `[Action:logoutBasket] Successfully logged out basket for user ${userId}`
    );

    // 상점 페이지 캐시 무효화
    revalidatePath("/shop");
    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    console.error(
      `[Action:logoutBasket] Unexpected error during basket logout:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니 로그아웃 중 예상치 못한 오류가 발생했습니다.",
    };
  }
}

/**
 * basketIdent를 초기화하고 상점 페이지로 리다이렉트합니다.
 * 클라이언트에서 페이지 새로고침 효과를 위해 사용합니다.
 */
export async function logoutBasketAndRedirectAction(): Promise<void> {
  try {
    const result = await logoutBasketAction();
    
    if (result.success) {
      console.log("[Action:logoutBasketAndRedirect] Redirecting to shop page");
      // 상점 페이지로 리다이렉트하여 새로고침 효과
      redirect("/shop");
    } else {
      console.error(
        "[Action:logoutBasketAndRedirect] Logout failed, not redirecting:",
        result.error
      );
      // 실패 시에도 상점 페이지로 리다이렉트 (에러는 클라이언트에서 처리)
      redirect("/shop?error=logout_failed");
    }
  } catch (error) {
    console.error(
      "[Action:logoutBasketAndRedirect] Error during logout and redirect:",
      error
    );
    // 에러 발생 시에도 상점 페이지로 리다이렉트
    redirect("/shop?error=unexpected_error");
  }
}

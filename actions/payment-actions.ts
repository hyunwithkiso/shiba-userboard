"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/schema";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * 사용자의 basketIdent를 DB에서 null로 설정하여 초기화합니다. (취소 시 사용)
 * @returns {Promise<{success: boolean, error?: string}>} 작업 성공 여부 및 에러 메시지
 */
export async function resetUserBasketAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "사용자 인증이 필요합니다." };
  }

  console.log(
    `[Action:resetUserBasket] Resetting basket ident to null for user ${userId}...`
  );

  try {
    // DB에서 사용자의 basketIdent를 null로 업데이트
    await db
      .update(users)
      .set({ basketIdent: null, updatedAt: new Date() }) // basketIdent를 null로 설정
      .where(eq(users.id, userId));

    console.log(
      `[Action:resetUserBasket] Basket ident reset to null for user ${userId}.`
    );

    // 장바구니 관련 캐시 무효화 (예: /cart 페이지)
    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    console.error(
      `[Action:resetUserBasket] Error resetting basket ident for user ${userId}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니 초기화 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 특정 basketIdent의 장바구니 정보를 가져옵니다.
 * @param basketIdent Tebex Basket Identifier
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} 성공 여부, 장바구니 데이터, 에러 메시지
 */
export async function getBasketAction(basketIdent: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    if (!basketIdent) {
      return { success: false, error: "유효하지 않은 장바구니 ID입니다." };
    }

    console.log(`[Action:getBasket] Fetching basket info for: ${basketIdent}`);

    // 라이브러리에서 getTebexBasket 함수 가져오기
    const { getBasket } = await import("@/lib/tebex");

    // 장바구니 정보 가져오기
    const basket = await getBasket(basketIdent);

    if (!basket) {
      return { success: false, error: "장바구니 정보를 찾을 수 없습니다." };
    }

    console.log(
      `[Action:getBasket] Successfully retrieved basket: ${basketIdent}`
    );
    return { success: true, data: basket };
  } catch (error) {
    console.error(
      `[Action:getBasket] Error fetching basket ${basketIdent}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니 정보를 가져오는데 실패했습니다.",
    };
  }
}

/**
 * Tebex Checkout API를 통해 확인된 basketIdent를 사용하여 Purchase 레코드를 생성합니다.
 * @param basketIdent Tebex Basket Identifier
 * @param transactionId 결제 트랜잭션 ID (선택적)
 * @returns 생성 결과 (성공 시 purchase 객체, 실패 시 에러 객체)
 */
export async function createPurchaseFromCheckout(
  basketIdent: string,
  transactionId?: string
): Promise<{ success: boolean; purchase?: any; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    console.log(
      `[Server Action] Attempting to create purchase for basket: ${basketIdent}, user: ${
        session.user.id
      }, transactionId: ${transactionId || "N/A"}`
    );

    // basketService.createPurchase를 직접 호출하도록 수정 (basketService 임포트 필요 시 추가)
    const { basketService } = await import("@/services/basket-service"); // 동적 임포트 또는 상단 임포트
    const purchase = await basketService.createPurchase(
      session.user.id,
      basketIdent,
      transactionId
    );

    console.log(
      `[Server Action] Purchase creation successful for basket: ${basketIdent}`,
      purchase
    );

    // 구매 내역 페이지 등 관련 경로를 재검증하여 캐시를 업데이트합니다.
    revalidatePath("/my-purchases"); // 실제 구매 내역 페이지 경로로 변경해야 할 수 있습니다.

    return { success: true, purchase };
  } catch (error: unknown) {
    console.error(
      `[Server Action] Error creating purchase for basket ${basketIdent}:`,
      error
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during purchase creation.";

    if (errorMessage.includes("already been recorded")) {
      return {
        success: false,
        error: "This purchase has already been recorded.",
      };
    }
    return { success: false, error: errorMessage };
  }
}

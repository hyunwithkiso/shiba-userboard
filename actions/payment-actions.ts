"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/schema";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { TebexCacheUtils } from "@/lib/tebex";
import { purchaseService } from "@/services/purchase-service";

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
    // 1. 기존 basketIdent 조회 (캐시 무효화용)
    const userData = await db
      .select({ basketIdent: users.basketIdent })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const oldBasketIdent = userData[0]?.basketIdent;

    // 2. DB에서 사용자의 basketIdent를 null로 업데이트
    await db
      .update(users)
      .set({ basketIdent: null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    console.log(
      `[Action:resetUserBasket] Basket ident reset to null for user ${userId}.`
    );

    // 3. ✅ Tebex 캐시 무효화 (중요!)
    if (oldBasketIdent) {
      TebexCacheUtils.invalidateBasket(oldBasketIdent);
      console.log(`[Action:resetUserBasket] Invalidated Tebex cache for basket ${oldBasketIdent}`);
    }

    // 4. Next.js 페이지 캐시 무효화
    revalidatePath("/cart");
    revalidatePath("/shop");
    revalidatePath("/");

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

    // 라이브러리 함수 동적 임포트 (헤드리스 우선, 실패 시 Checkout API 폴백)
    const { getBasket } = await import("@/lib/tebex");
    let basket = null as any;
    try {
      basket = await getBasket(basketIdent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // 429 또는 레이트 리밋/네트워크 오류 시 Checkout API로 폴백 시도
      const isRateLimited = /429|Too Many Requests|rate/i.test(msg);
      const isNetworkish = /fetch|network|timeout/i.test(msg);
      if (!(isRateLimited || isNetworkish)) {
        throw err;
      }
    }

    if (!basket) {
      try {
        const { getCheckoutBasket } = await import("@/lib/tebex");
        basket = await getCheckoutBasket(basketIdent);
      } catch (fallbackErr) {
        console.error("[Action:getBasket] Fallback (Checkout API) failed:", fallbackErr);
      }
    }

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
    if (purchase && (purchase as any).success) {
      console.log(
        `[Server Action] Purchase creation successful for basket: ${basketIdent}`,
        purchase
      );
      // 구매 내역 페이지 등 관련 경로 재검증
      revalidatePath("/purchases");
      const summary = (purchase as any).purchase ?? null;
      return { success: true, purchase: summary };
    }
    console.warn(
      `[Server Action] Purchase creation failed for basket: ${basketIdent}`,
      purchase
    );
    return {
      success: false,
      error:
        (purchase as any)?.message ||
        "구매 기록 생성에 실패했습니다. 결제 완료 여부 또는 네트워크 상태를 확인해주세요.",
    };
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

/**
 * basketIdent로 이미 기록된 구매 내역을 조회합니다.
 */
export async function getPurchaseByBasketIdentAction(basketIdent: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    if (!basketIdent) {
      return { success: false, error: "유효하지 않은 장바구니 ID입니다." };
    }
    const purchase = await purchaseService.getPurchaseByBasketIdent(basketIdent);
    if (!purchase) {
      return { success: false, error: "구매 내역을 찾을 수 없습니다." };
    }
    return { success: true, data: purchase };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "구매 내역을 가져오는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * purchases.id(txn-id)로 단일 구매 내역을 조회합니다.
 */
export async function getPurchaseByIdAction(id: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: "유효하지 않은 거래 ID입니다." };
    }
    const { db, purchases } = await import("@/lib/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
    if (!rows || rows.length === 0) {
      return { success: false, error: "구매 내역을 찾을 수 없습니다." };
    }
    return { success: true, data: rows[0] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "구매 내역 조회 중 오류가 발생했습니다.",
    };
  }
}

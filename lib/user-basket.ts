import { createBasket } from "@/lib/tebex";
import { auth } from "@/lib/auth";

/**
 * 현재 로그인한 사용자의 유효한 Tebex 장바구니 식별자(ident)를 가져옵니다.
 * 없거나 유효하지 않으면 새로 생성하고 DB에 저장합니다.
 * @returns {Promise<string | null>} 유효한 basketIdent 또는 오류 시 null
 */
export async function getValidBasketIdent(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.id) {
    console.error("[getValidBasketIdent] User not authenticated.");
    return null;
  }

  const userId = session.user.id;

  try {
    // --- 임시 주석 처리 시작 ---
    // TODO: lib/schema.ts의 users 테이블에 basketIdent 컬럼 추가 및 마이그레이션 후 아래 주석 해제
    /*
    // 1. DB에서 사용자의 basketIdent 조회
    const userData = await db
      .select({ basketIdent: users.basketIdent })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let currentIdent = userData[0]?.basketIdent;

    // 2. ident가 있으면 Tebex에서 유효성 검사
    if (currentIdent) {
      console.log(
        `[getValidBasketIdent] Found ident in DB: ${currentIdent}. Validating...`
      );
      const basket = await getBasket(currentIdent);
      if (basket && !basket.complete) {
        console.log(`[getValidBasketIdent] Ident ${currentIdent} is valid.`);
        return currentIdent; // 유효한 ident 반환
      } else {
        console.log(
          `[getValidBasketIdent] Ident ${currentIdent} is invalid or completed. Creating a new one.`
        );
        currentIdent = null; // 유효하지 않으므로 새로 생성하도록 null 처리
      }
    }
    */
    // --- 임시 주석 처리 끝 ---

    // 3. 항상 새로 생성 (임시 조치)
    let currentIdent = null;
    if (!currentIdent) {
      console.log(
        "[getValidBasketIdent] Creating a new basket (Temporary measure)..."
      );
      const completeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/complete`;
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`;

      const newBasket = await createBasket(completeUrl, cancelUrl);
      if (newBasket?.ident) {
        console.log(
          `[getValidBasketIdent] New basket created with ident: ${newBasket.ident}`
        );
        // --- 임시 주석 처리 시작 ---
        // TODO: lib/schema.ts의 users 테이블에 basketIdent 컬럼 추가 및 마이그레이션 후 아래 주석 해제
        /*
        // 4. 새로 생성된 ident를 DB에 저장
        await db
          .update(users)
          .set({ basketIdent: newBasket.ident, updatedAt: new Date() })
          .where(eq(users.id, userId));
        console.log(
          `[getValidBasketIdent] New ident ${newBasket.ident} saved to DB for user ${userId}.`
        );
        */
        console.warn(
          "[getValidBasketIdent] DB update skipped (Temporary measure). Need to add 'basketIdent' to schema."
        );
        // --- 임시 주석 처리 끝 ---
        return newBasket.ident;
      } else {
        throw new Error("Failed to create a new basket in Tebex.");
      }
    }

    return null;
  } catch (error) {
    console.error("[getValidBasketIdent] Error managing basket ident:", error);
    return null;
  }
}

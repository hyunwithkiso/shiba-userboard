"use server";

import { basketService } from "@/services/basket-service";
import { auth } from "@/lib/auth";
import { db, purchases, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * 사용자의 현재 장바구니 정보를 가져옵니다.
 * 서비스 레이어의 getUserBasket을 호출합니다.
 */
export async function getUserBasketAction() {
  try {
    const basket = await basketService.getUserBasket();
    // 성공 시 basket 객체 전체 반환 (링크 포함)
    return { success: true, data: basket };
  } catch (error) {
    console.error("[Action:getUserBasket] Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";

    // 사용자에게 표시될 최종 오류 메시지
    let friendlyErrorMessage = "장바구니를 불러오는 중 오류가 발생했습니다.";
    if (errorMessage.includes("User not authenticated")) {
      friendlyErrorMessage = "로그인이 필요합니다.";
    } else if (errorMessage.includes("Failed to create new basket")) {
      friendlyErrorMessage =
        "장바구니를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.";
    }

    return {
      success: false,
      error: friendlyErrorMessage,
      originalError: errorMessage, // 개발/디버깅용
    };
  }
}

/**
 * 장바구니 인증 URL을 가져옵니다.
 * (Tebex 결제 페이지 리디렉션을 위해 필요)
 */
export async function getBasketAuthUrlAction(
  basketIdent: string,
  returnUrl: string
) {
  try {
    if (!basketIdent || !returnUrl) {
      return {
        success: false,
        error: "잘못된 요청입니다. 장바구니 ID와 반환 URL이 필요합니다.",
      };
    }
    const authUrls = await basketService.getBasketAuthUrl(
      basketIdent,
      returnUrl
    );
    // 성공 시 { checkout: '...', return: '...' } 형태의 객체 반환
    return { success: true, data: authUrls };
  } catch (error) {
    console.error("[Action:getBasketAuthUrl] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니 인증 URL을 가져오는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니에 상품을 추가합니다.
 * 서비스의 addToCart (검증 로직 포함)를 호출합니다.
 */
export async function addPackageToBasketAction(
  packageId: number,
  quantity: number = 1
) {
  try {
    const result = await basketService.addToCart(packageId, quantity);

    if (result.success) {
      revalidatePath("/store/cart"); // 장바구니 페이지 캐시 무효화
      revalidatePath("/basket"); // 다른 장바구니 관련 컴포넌트 캐시 무효화 (필요시)
      return { success: true, data: result.data };
    } else {
      // 서비스 레벨에서 반환된 오류 메시지 사용
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("[Action:addPackageToBasket] Error:", error);
    // 예상치 못한 액션 레벨 오류 처리
    return {
      success: false,
      error: "장바구니에 상품을 추가하는 중 예기치 않은 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니에서 상품을 제거합니다.
 */
export async function removePackageFromBasketAction(packageId: number) {
  try {
    const basket = await basketService.removePackageFromBasket(packageId);
    revalidatePath("/store/cart");
    revalidatePath("/basket");
    // 성공 시 업데이트된 장바구니 또는 성공 메시지 반환 (서비스 구현에 따라 다름)
    return { success: true, data: basket };
  } catch (error) {
    console.error("[Action:removePackageFromBasket] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상품을 장바구니에서 제거하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니 상품 수량을 업데이트합니다.
 */
export async function updatePackageQuantityAction(
  packageId: number,
  quantity: number
) {
  try {
    if (quantity < 1) {
      return { success: false, error: "수량은 1 이상이어야 합니다." };
    }
    const basket = await basketService.updatePackageQuantity(
      packageId,
      quantity
    );
    revalidatePath("/store/cart");
    revalidatePath("/basket");
    // 성공 시 업데이트된 장바구니 반환
    return { success: true, data: basket };
  } catch (error) {
    console.error("[Action:updatePackageQuantity] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상품 수량을 업데이트하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니에 쿠폰을 적용합니다.
 */
export async function applyCouponAction(couponCode: string) {
  try {
    const basket = await basketService.applyCouponToBasket(couponCode);
    revalidatePath("/store/cart");
    revalidatePath("/basket");
    // 성공 시 쿠폰 적용 결과 또는 업데이트된 장바구니 반환
    return { success: true, data: basket };
  } catch (error) {
    console.error("[Action:applyCoupon] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "쿠폰을 적용하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니에 크리에이터 코드를 적용합니다.
 */
export async function applyCreatorCodeAction(creatorCode: string) {
  try {
    const basket = await basketService.applyCreatorCodeToBasket(creatorCode);
    revalidatePath("/store/cart");
    revalidatePath("/basket");
    // 성공 시 코드 적용 결과 또는 업데이트된 장바구니 반환
    return { success: true, data: basket };
  } catch (error) {
    console.error("[Action:applyCreatorCode] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "크리에이터 코드를 적용하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 결제 완료 후 구매 정보를 기록하고 새 장바구니를 생성합니다.
 * Tebex 웹훅을 사용하는 것이 더 안정적입니다.
 */
export async function completeCheckoutAction(basketIdent: string) {
  try {
    const session = await auth(); // Use NextAuth.js auth
    const userId = session?.user?.id; // Use user.id from NextAuth session

    if (!userId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    if (!basketIdent) {
      return {
        success: false,
        error: "유효하지 않은 장바구니 ID입니다.",
      };
    }

    // 서비스 레이어의 createPurchase 호출
    const result = await basketService.createPurchase(userId, basketIdent);

    if (result.success) {
      console.log(
        `[Action:completeCheckout] Purchase created successfully for basket ${basketIdent}`
      );
      // 구매 완료 후 관련 페이지 캐시 무효화 (예: 구매 내역 페이지)
      revalidatePath("/mypage/purchases"); // 예시 경로
      revalidatePath("/store/cart"); // 장바구니 비우기 반영
      revalidatePath("/basket");

      // 구매 완료 후, 사용자에게 새 장바구니를 할당하는 로직은
      // basketService.getUserBasket() 호출 시 자동으로 처리됨 (기존 ident 무효화 및 재생성)
      // 따라서 여기서 별도로 createNewBasket을 호출할 필요는 없음.

      return {
        success: true,
        message: "결제가 성공적으로 처리되었습니다.",
        purchaseIds: result.purchaseIds,
      };
    } else {
      console.error(
        `[Action:completeCheckout] Failed to create purchase for basket ${basketIdent}:`,
        result.message
      );
      return {
        success: false,
        error: result.message || "구매 정보를 저장하는 중 오류가 발생했습니다.",
      };
    }
  } catch (error) {
    console.error("[Action:completeCheckout] Error:", error);
    return {
      success: false,
      error: "결제 완료 처리 중 예기치 않은 오류가 발생했습니다.",
    };
  }
}

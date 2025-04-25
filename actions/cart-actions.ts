"use server";

import { auth } from "@/lib/auth";
import { basketService } from "@/services/basket-service";
// import { addPackageToBasket, updatePackageQuantity } from "@/lib/tebex"; // lib/tebex 직접 호출 제거
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
  // data?: TebexBasket; // 필요시 업데이트된 Basket 데이터 포함 가능
}

/**
 * 현재 사용자의 장바구니에 상품을 추가합니다. (서비스 호출)
 * @param packageId 추가할 Tebex 상품(패키지) ID
 * @param quantity 수량 (기본값 1)
 * @returns 작업 결과
 */
export async function addCartItemAction(
  packageId: number,
  quantity: number = 1
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "사용자 인증이 필요합니다." };
  }

  // BasketService의 getUserBasketIdent 및 createNewBasket 호출은 서비스 내부에서 처리될 수 있음
  // 여기서는 basketService의 addPackageToBasket을 직접 호출
  try {
    console.log(
      `[Action:addCartItem] Calling basketService.addPackageToBasket for user ${userId}, package ${packageId}`
    );
    // BasketService의 addPackageToBasket 호출 (내부적으로 ident 확인/생성 및 API 호출)
    await basketService.addPackageToBasket(packageId, quantity);

    revalidatePath("/cart");
    console.log(
      `[Action:addCartItem] Successfully added package ${packageId} via basketService`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `[Action:addCartItem] Error adding item via basketService for user ${userId}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니에 상품을 추가하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니 내 특정 상품의 수량을 업데이트합니다. (서비스 호출)
 * @param packageId 업데이트할 Tebex 상품(패키지) ID
 * @param quantity 새로운 수량
 * @returns 작업 결과
 */
export async function updateCartItemQuantityAction(
  packageId: number, // basketPackageId 대신 packageId 사용
  quantity: number
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "사용자 인증이 필요합니다." };
  }

  // BasketService의 getUserBasketIdent 호출은 서비스 내부에서 처리
  try {
    console.log(
      `[Action:updateQuantity] Calling basketService.updatePackageQuantity for user ${userId}, package ${packageId} to ${quantity}`
    );
    // BasketService의 updatePackageQuantity 호출
    await basketService.updatePackageQuantity(packageId, quantity);

    revalidatePath("/cart");
    console.log(
      `[Action:updateQuantity] Successfully updated quantity for package ${packageId} via basketService`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `[Action:updateQuantity] Error updating quantity via basketService for user ${userId} (pkg id: ${packageId}):`,
      error
    );
    // 서비스 레이어 또는 lib/tebex에서 발생한 특정 에러 처리
    if (
      error instanceof Error &&
      error.message.includes("Quantity must be at least 1")
    ) {
      return {
        success: false,
        error:
          "수량은 1 이상이어야 합니다. 상품을 삭제하려면 삭제 버튼을 사용하세요.",
      };
    }
    // Tebex API 422 에러 등 구체적인 처리 추가 가능
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상품 수량 변경 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니에서 특정 상품을 제거합니다. (서비스 호출)
 * @param packageId 제거할 Tebex 상품(패키지) ID
 * @returns 작업 결과
 */
export async function removeCartItemAction(
  packageId: number // basketPackageId 대신 packageId 사용
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "사용자 인증이 필요합니다." };
  }

  try {
    console.log(
      `[Action:removeItem] Calling basketService.removePackageFromBasket for user ${userId}, package ${packageId}`
    );
    // BasketService의 removePackageFromBasket 호출
    await basketService.removePackageFromBasket(packageId);

    revalidatePath("/cart");
    console.log(
      `[Action:removeItem] Successfully removed package ${packageId} via basketService`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `[Action:removeItem] Error removing item via basketService for user ${userId} (pkg id: ${packageId}):`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상품 삭제 중 오류가 발생했습니다.",
    };
  }
}

// getCheckoutUrlAction은 현재 사용되지 않으므로 주석 처리 또는 삭제 가능
/*
export async function getCheckoutUrlAction(): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  // ... (기존 로직) ...
}
*/

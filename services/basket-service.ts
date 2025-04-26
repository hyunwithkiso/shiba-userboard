import { auth } from "@/lib/auth";
import { db, users, purchases } from "@/lib/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import type {
  TebexBasket,
  BasketPackageDetail,
  TebexPackage,
  TebexAuthLink,
} from "@/lib/tebex";
import {
  createBasket as createTebexBasket,
  getBasket as getTebexBasket,
  addPackageToBasket as addTebexPackage,
  removePackageFromBasket as removeTebexPackage,
  updatePackageQuantity as updateTebexPackageQuantity,
  createBasket,
} from "@/lib/tebex";

export class BasketService {
  // Tebex API 엔드포인트
  private TEBEX_API_BASE_URL =
    process.env.TEBEX_API_URL || "https://headless.tebex.io/api";
  private TEBEX_PUBLIC_TOKEN = process.env.TEBEX_PUBLIC_TOKEN || "";
  private TEBEX_PRIVATE_KEY = process.env.TEBEX_PRIVATE_KEY; // Need for some operations

  // Internal helper for authenticated Tebex API calls
  private async fetchTebexApiInternal<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuth: boolean = true, // Default to using auth for internal helper
    isAccountEndpoint: boolean = false // Default to NOT using /accounts/{token} path
  ): Promise<T> {
    if (!this.TEBEX_API_BASE_URL) {
      throw new Error("Tebex API URL is not configured.");
    }

    let baseUrl = this.TEBEX_API_BASE_URL;
    if (isAccountEndpoint) {
      if (!this.TEBEX_PUBLIC_TOKEN) {
        throw new Error("Tebex Public Token is not configured.");
      }
      baseUrl = `${this.TEBEX_API_BASE_URL}/accounts/${this.TEBEX_PUBLIC_TOKEN}`;
    }

    const url = `${baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(typeof options.headers === "object" &&
      options.headers !== null &&
      !Array.isArray(options.headers)
        ? Object.fromEntries(
            Object.entries(options.headers).map(([k, v]) => [k, String(v)])
          )
        : {}),
    };

    if (useAuth) {
      if (!this.TEBEX_PRIVATE_KEY) {
        throw new Error(
          "Tebex Private Key is not configured for authenticated request."
        );
      }
      headers["X-Tebex-Secret"] = this.TEBEX_PRIVATE_KEY;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any = { message: response.statusText };
        try {
          errorData = await response.json();
        } catch (e) {
          try {
            errorData.message = await response.text();
          } catch (textError) {
            // Ignore
          }
        }
        console.error(
          `Tebex API Error (${response.status}) for ${url}:`,
          errorData
        );
        const errorMessage =
          errorData?.error ||
          errorData?.errors?.[0]?.message ||
          errorData?.message ||
          `HTTP error! status: ${response.status}`;
        throw new Error(`Failed to fetch Tebex API (${url}): ${errorMessage}`);
      }

      const result = await response.json();
      return result.data ?? result;
    } catch (error) {
      console.error(`Error calling Tebex API (${url}):`, error);
      throw error;
    }
  }

  /**
   * Tebex 장바구니 인증 링크를 가져옵니다.
   */
  async getBasketAuthUrl(
    basketIdent: string,
    returnUrl: string
  ): Promise<TebexAuthLink[]> {
    if (!this.TEBEX_PUBLIC_TOKEN) {
      throw new Error("Tebex Public Token is not configured.");
    }
    if (!this.TEBEX_API_BASE_URL) {
      throw new Error("Tebex API URL is not configured.");
    }

    const url = `${this.TEBEX_API_BASE_URL}/accounts/${
      this.TEBEX_PUBLIC_TOKEN
    }/baskets/${basketIdent}/auth?returnUrl=${encodeURIComponent(returnUrl)}`;
    console.log(`[BasketService] Fetching auth URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let errorBody = await response.text();
        try {
          errorBody = JSON.parse(errorBody);
        } catch {
          /* ignore */
        }
        console.error(
          `[BasketService] Failed to get basket auth URL (${response.status}):`,
          errorBody
        );
        throw new Error(
          `Failed to get basket auth URL: ${
            response.statusText
          } ${JSON.stringify(errorBody)}`
        );
      }

      const responseData: TebexAuthLink[] | { data: TebexAuthLink[] } =
        await response.json();

      const authLinks = Array.isArray(responseData)
        ? responseData
        : responseData.data;

      if (!Array.isArray(authLinks)) {
        console.error(
          "[BasketService] Invalid auth link response format:",
          responseData
        );
        throw new Error("Invalid response format for auth links.");
      }

      console.log(
        `[BasketService] Received auth links for ${basketIdent}:`,
        authLinks
      );
      return authLinks;
    } catch (error) {
      console.error("[BasketService] Error getting basket auth URL:", error);
      throw error;
    }
  }

  /**
   * 새 Tebex 장바구니를 생성하고 DB에 ident를 저장합니다.
   */
  async createNewBasket(
    userId: string
  ): Promise<{ success: boolean; basketIdent?: string; error?: string }> {
    try {
      console.log(`[BasketService] Creating new basket for user: ${userId}`);
      // Tebex에서 먼저 장바구니 생성
      const completeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/complete`; // Define URLs here
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`;
      const basketData = await createTebexBasket(completeUrl, cancelUrl); // Use imported function
      console.log("[BasketService] Basket created in Tebex:", basketData);

      // DB에 basketIdent 업데이트
      await db
        .update(users)
        .set({ basketIdent: basketData.ident, updatedAt: new Date() })
        .where(eq(users.id, userId));
      console.log(
        `[BasketService] Basket ident ${basketData.ident} saved to DB for user ${userId}.`
      );

      return { success: true, basketIdent: basketData.ident };
    } catch (error) {
      console.error("[BasketService] Error creating new basket:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create new basket",
      };
    }
  }

  /**
   * 사용자의 유효한 Tebex 장바구니를 가져옵니다.
   * DB 조회 -> Tebex 유효성 검사 -> 없으면 생성 순서
   */
  async getUserBasket(): Promise<TebexBasket> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    console.log(`[BasketService] Getting basket for user: ${userId}`);

    // 1. DB에서 basketIdent 조회
    const userData = await db
      .select({ basketIdent: users.basketIdent })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    let basketIdent = userData[0]?.basketIdent;

    // 2. ident가 있으면 Tebex에서 유효성 검사
    if (basketIdent) {
      console.log(
        `[BasketService] Found ident in DB: ${basketIdent}. Validating...`
      );
      try {
        const basket = await getTebexBasket(basketIdent); // lib/tebex의 함수 사용
        if (basket && !basket.complete) {
          console.log(`[BasketService] Ident ${basketIdent} is valid.`);
          return basket; // 유효한 장바구니 반환
        } else {
          console.log(
            `[BasketService] Ident ${basketIdent} is invalid or completed.`
          );
          basketIdent = null; // 유효하지 않음
        }
      } catch (error) {
        console.warn(
          `[BasketService] Validation failed for ident ${basketIdent}:`,
          error
        );
        basketIdent = null; // 검증 실패 시 유효하지 않음
      }
    }

    // 3. 유효한 ident가 없으면 새로 생성
    console.log("[BasketService] No valid basket found, creating new one...");
    const creationResult = await this.createNewBasket(userId);
    if (!creationResult.success || !creationResult.basketIdent) {
      throw new Error(`Failed to create new basket: ${creationResult.error}`);
    }

    // 4. 새로 생성된 장바구니 정보 반환
    const newBasket = await getTebexBasket(creationResult.basketIdent);
    if (!newBasket) {
      throw new Error(
        `Failed to retrieve newly created basket: ${creationResult.basketIdent}`
      );
    }
    console.log(
      `[BasketService] Returning newly created basket: ${newBasket.ident}`
    );
    return newBasket;
  }

  /**
   * 장바구니에 상품을 추가합니다. (lib/tebex 래핑)
   */
  async addPackageToBasket(
    packageId: number,
    quantity: number = 1
  ): Promise<TebexBasket> {
    const basket = await this.getUserBasket(); // 유효한 ident 확보 및 현재 장바구니 상태 로드
    const basketIdent = basket.ident;

    console.log(
      `[BasketService] Adding package ${packageId} (qty: ${quantity}) to basket ${basketIdent}`
    );

    // lib/tebex의 export된 함수 사용
    const updatedBasket = await addTebexPackage(
      basketIdent,
      packageId,
      quantity
    );
    console.log(updatedBasket);

    console.log(
      "[BasketService] Package added, updated basket:",
      updatedBasket
    );
    // API 응답이 업데이트된 Basket 객체인지 확인 필요
    // 만약 업데이트된 Basket을 반환하지 않는다면, getUserBasket을 다시 호출해야 할 수 있음
    return updatedBasket;
  }

  /**
   * 장바구니에서 상품을 제거합니다. (lib/tebex 래핑 - API 문서 기반)
   */
  async removePackageFromBasket(packageId: number): Promise<TebexBasket> {
    // 반환 타입 수정
    const basket = await this.getUserBasket(); // 유효한 ident 확보
    const basketIdent = basket.ident;
    console.log(
      `[BasketService] Removing package ${packageId} from basket ${basketIdent}`
    );

    // lib/tebex의 export된 함수 사용 (POST /remove)
    const updatedBasket = await removeTebexPackage(basketIdent, packageId);
    console.log(
      "[BasketService] Package removed, updated basket:",
      updatedBasket
    );
    // removeTebexPackage가 업데이트된 Basket 반환하므로 그대로 반환
    return updatedBasket;
  }

  /**
   * 장바구니 결제를 진행합니다.
   */
  async proceedToCheckout(): Promise<string> {
    try {
      const basket = await this.getUserBasket();
      if (!basket?.links?.checkout) {
        throw new Error("Checkout link not available in the basket.");
      }
      return basket.links.checkout;
    } catch (error) {
      console.error("[BasketService] Error proceeding to checkout:", error);
      throw new Error("결제 진행 중 오류가 발생했습니다.");
    }
  }

  /**
   * 장바구니에 쿠폰을 적용합니다.
   */
  async applyCouponToBasket(couponCode: string): Promise<any> {
    const basket = await this.getUserBasket();
    const basketIdent = basket.ident;
    console.log(
      `[BasketService] Applying coupon ${couponCode} to basket ${basketIdent}`
    );
    // Use internal fetch helper as there's no dedicated exported function
    return this.fetchTebexApiInternal<any>(
      `/baskets/${basketIdent}/coupons`,
      {
        method: "POST",
        body: JSON.stringify({ coupon_code: couponCode }),
      },
      true, // Applying coupon likely needs auth
      false
    );
  }

  /**
   * 장바구니에 크리에이터 코드를 적용합니다.
   */
  async applyCreatorCodeToBasket(creatorCode: string): Promise<any> {
    const basket = await this.getUserBasket();
    const basketIdent = basket.ident;
    console.log(
      `[BasketService] Applying creator code ${creatorCode} to basket ${basketIdent}`
    );
    // Use internal fetch helper
    return this.fetchTebexApiInternal<any>(
      `/baskets/${basketIdent}/creator-codes`,
      {
        method: "POST",
        body: JSON.stringify({ creator_code: creatorCode }),
      },
      true, // Applying creator code likely needs auth
      false
    );
  }

  /**
   * 장바구니 완료 처리를 합니다.
   */
  async completeBasket(basketIdent: string): Promise<boolean> {
    console.log(
      `[BasketService] Completing basket (Placeholder): ${basketIdent}`
    );
    // 실제로는 결제 완료 후 웹훅 등에서 createPurchase 호출? 또는 여기서?
    // 현재는 특별한 작업 없이 true 반환
    return true;
  }

  /**
   * 장바구니 상품 수량을 업데이트합니다. (lib/tebex 래핑 - API 문서 기반)
   */
  async updatePackageQuantity(
    packageId: number, // Tebex Package ID
    quantity: number
  ): Promise<any> {
    // 반환 타입은 API 응답에 따라 달라질 수 있음 (any 유지 또는 구체화)
    if (quantity <= 0) {
      // 서비스 레벨에서도 0 이하 수량 방지 또는 경고
      console.warn(
        `[BasketService] updatePackageQuantity called with quantity <= 0 for package ${packageId}. Delegating removal logic if applicable.`
      );
      // 여기서 직접 removePackageFromBasket을 호출하거나 에러 발생 가능
      // 우선 lib/tebex 호출로 넘김 (lib에서 처리 또는 API 에러 반환 기대)
      // throw new Error("Quantity must be greater than 0. Use removePackageFromBasket to remove.");
    }
    const basket = await this.getUserBasket();
    const basketIdent = basket.ident;
    console.log(
      `[BasketService] Updating package ${packageId} quantity to ${quantity} in basket ${basketIdent}`
    );

    // basketPackageId를 찾는 로직 제거
    // const itemInBasket = basket.packages.find((p) => p.id === packageId);
    // if (!itemInBasket) {
    //   throw new Error(
    //     `Package with ID ${packageId} not found in basket ${basketIdent}`
    //   );
    // }
    // const basketPackageId = itemInBasket.in_basket.id;

    // lib/tebex의 export된 함수 사용 (PUT /{packageId})
    // updateTebexPackageQuantity 함수는 basketPackageId를 받지 않음
    const result = await updateTebexPackageQuantity(
      basketIdent,
      packageId,
      quantity
    );
    console.log(
      `[BasketService] Quantity update result for package ${packageId}:`,
      result
    );
    // API가 204 No Content 등을 반환할 수 있으므로, 결과 처리 주의
    // 필요시 업데이트된 장바구니 정보를 다시 fetch하여 반환
    // return await this.getUserBasket(); // 예시: 업데이트 후 최신 정보 반환
    return result; // 우선 API 응답 그대로 반환
  }

  /**
   * 패키지 정보를 조회합니다. (Public Endpoint)
   */
  private async getPackage(
    packageId: number
  ): Promise<{ success: boolean; message?: string; data?: TebexPackage }> {
    try {
      // Use fetch directly for public endpoint
      const response = await fetch(
        `${this.TEBEX_API_BASE_URL}/accounts/${this.TEBEX_PUBLIC_TOKEN}/packages/${packageId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          message: "상품 정보를 찾을 수 없습니다.",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data, // Assuming package data is in `data` field
      };
    } catch (error) {
      console.error("Error getting package:", error);
      return {
        success: false,
        message: "상품 정보 조회 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 장바구니에 상품을 추가합니다. (addToCart - 사용자 상호작용용 래퍼)
   * 최소/최대 금액 등 비즈니스 로직 포함 가능.
   */
  async addToCart(
    packageId: number,
    quantity: number = 1
  ): Promise<{
    success: boolean;
    message?: string;
    data?: TebexBasket;
    requireFiveMAuth?: boolean;
  }> {
    try {
      const session = await auth();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          success: false,
          message: "사용자 인증이 필요합니다.",
        };
      }

      // FiveM 인증 확인 (이 로직은 Action으로 이동하는 것이 더 적절할 수 있음)
      // const hasFiveMAuth = await hasFiveMAuthenticated(userId); // Needs reimplementation
      // if (!hasFiveMAuth) {
      //   return {
      //     success: false,
      //     message: "FiveM 인증이 필요합니다.",
      //     requireFiveMAuth: true,
      //   };
      // }

      // 추가할 패키지 정보 조회 (가격 체크용)
      const packageInfoResult = await this.getPackage(packageId);
      if (!packageInfoResult.success || !packageInfoResult.data) {
        return {
          success: false,
          message: packageInfoResult.message || "상품 정보를 찾을 수 없습니다.",
        };
      }

      const packagePrice = packageInfoResult.data.total_price ?? 0; // Use total_price

      // 최소 결제 금액 체크 ($0.77)
      // if (packagePrice * quantity < 0.77) {
      //   return {
      //     success: false,
      //     message: `최소 결제 금액은 $0.77입니다. (현재 상품 총액: $${(
      //       packagePrice * quantity
      //     ).toFixed(2)})`,
      //   };
      // }

      // 사용자의 현재 장바구니 가져오기 (없으면 생성됨)
      const currentBasket = await this.getUserBasket();
      const basketIdent = currentBasket.ident;

      // 현재 장바구니의 총 금액 계산
      let currentTotal = 0;
      if (currentBasket.packages && currentBasket.packages.length > 0) {
        currentTotal = currentBasket.packages.reduce(
          (sum: number, pkg: BasketPackageDetail) => {
            const price = pkg.in_basket?.price || 0;
            const qty = pkg.in_basket?.quantity || 1;
            return sum + price * qty;
          },
          0
        );
      }

      // 최대 장바구니 금액 체크 ($500)
      if (currentTotal + packagePrice * quantity > 500) {
        return {
          success: false,
          message: `장바구니 최대 금액($500)을 초과합니다. (현재: $${currentTotal.toFixed(
            2
          )}, 추가 시: $${(currentTotal + packagePrice * quantity).toFixed(
            2
          )})`,
        };
      }

      // 상품 추가 (실제 Tebex API 호출)
      const updatedBasket = await this.addPackageToBasket(packageId, quantity); // Use the other method

      return {
        success: true,
        data: updatedBasket,
      };
    } catch (error) {
      console.error("Error adding to cart in service:", error);
      return {
        success: false,
        message: "장바구니에 상품을 추가하는 중 오류가 발생했습니다.",
      };
    }
  }

  async createPurchase(
    userId: string,
    basketIdent: string,
    transactionId?: string
  ): Promise<{ success: boolean; message?: string; purchaseIds?: string[] }> {
    try {
      console.log(
        `[BasketService.createPurchase] Fetching basket info: ${basketIdent}`
      );
      // getTebexBasket 사용
      const basket = await getTebexBasket(basketIdent);

      if (!basket) {
        throw new Error(
          `[BasketService.createPurchase] Basket not found: ${basketIdent}`
        );
      }

      // 이미 처리된 구매인지 확인
      console.log(
        `[BasketService.createPurchase] 기존 구매 기록 확인 중: ${basketIdent}`
      );
      const existingPurchases = await db
        .select({ id: purchases.id })
        .from(purchases)
        .where(eq(purchases.basketIdent, basketIdent))
        .limit(1);

      if (existingPurchases.length > 0) {
        console.log(
          `[BasketService.createPurchase] 이미 처리된 구매입니다: ${basketIdent}`
        );
        return { success: false, message: "이미 처리된 구매입니다" };
      }

      // 장바구니 완료 상태 확인 (Tebex 웹훅 처리가 이상적이지만, 여기서 확인)
      if (!basket.complete) {
        console.log(
          `[BasketService.createPurchase] 완료되지 않은 장바구니입니다: ${basketIdent}. 결제가 완료되었는지 확인하세요.`
        );
        // 결제가 실제로 완료되었다고 가정하고 진행하거나, 오류 반환
        // return { success: false, message: "완료되지 않은 장바구니입니다. Tebex에서 결제를 완료해주세요." };
        // 여기서는 경고만 남기고 진행 (웹훅 구현 전 임시 방편)
      }

      console.log(
        `[BasketService.createPurchase] Saving purchase for basket: ${basketIdent}`
      );
      const purchaseId = transactionId || crypto.randomUUID();

      if (basket.packages && basket.packages.length > 0) {
        // 타입 명시 추가
        const itemsArray = basket.packages.map((pkg: BasketPackageDetail) => {
          const inBasket = pkg.in_basket || {
            quantity: 1,
            price: pkg.total_price || 0,
          }; // 기본값 강화
          const quantity = inBasket.quantity || 1;
          // 가격 결정 로직 개선: 개별 가격(price) 우선, 없으면 총 가격(total_price) 사용
          const price =
            inBasket.price !== undefined && inBasket.price !== null
              ? inBasket.price // 개당 가격이 명확히 있으면 사용
              : pkg.base_price !== undefined && pkg.base_price !== null
              ? pkg.base_price // 기본 가격 사용
              : pkg.total_price !== undefined && pkg.total_price !== null
              ? pkg.total_price / quantity // 총 가격에서 역산 (주의!)
              : 0; // 가격 정보 없으면 0

          const totalPrice = price * quantity;

          return {
            id: pkg.id,
            name: pkg.name,
            quantity: quantity,
            price: Math.round(price * 100), // cents
            totalPrice: Math.round(totalPrice * 100), // cents
            image: pkg.image || null,
            description: pkg.description || null,
            // 'inBasket' 필드는 DB 스키마에 맞게 제거하거나 JSONB 등으로 저장 필요
            // 여기서는 제거하고 필요한 정보만 추출함
          };
        });

        const totalBasketPrice = itemsArray.reduce(
          (sum: number, item: { totalPrice: number }) => sum + item.totalPrice,
          0
        );

        await db.insert(purchases).values({
          id: purchaseId,
          userId: userId,
          basketIdent: basketIdent,
          items: itemsArray, // 전체 아이템 저장 (JSONB 타입이어야 함)
          totalAmount: totalBasketPrice, // 계산된 총액 (cents)
          currency: basket.currency || "USD",
          status: "completed", // 실제 결제 상태 반영 필요 (웹훅 권장)
          purchasedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          // Tebex 트랜잭션 ID 저장 (있는 경우)
          tebexTransactionId: transactionId
            ? parseInt(transactionId, 10) || null
            : null,
          // 호환성 필드는 제거하거나 필요시 첫 아이템 기준으로 유지
          packageId: itemsArray[0]?.id || 0,
          packageName: itemsArray[0]?.name || "Unknown",
          quantity: itemsArray[0]?.quantity || 1,
          basePrice: itemsArray[0]?.price || 0, // 주의: cents 단위 개당 가격
        });
        return { success: true, purchaseIds: [purchaseId] };
      } else {
        return { success: false, message: "장바구니에 상품이 없습니다." };
      }
    } catch (error) {
      console.error("[BasketService.createPurchase] Error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "구매 정보 저장 중 오류 발생",
      };
    }
  }

  /**
   * 사용자 ID로 데이터베이스에서 활성 Tebex 장바구니 식별자를 조회합니다.
   * @param userId 사용자 ID
   * @returns 활성 basketIdent 또는 null
   */
  async getUserBasketIdent(userId: string): Promise<string | null> {
    if (!userId) {
      console.warn("[BasketService] getUserBasketIdent called without userId.");
      return null;
    }
    try {
      console.log(
        `[BasketService] Fetching basket ident for user ${userId}...`
      );
      // Drizzle 사용 예시 (Prisma 사용 시 findUnique 등으로 변경)
      const userResult = await db
        .select({ basketIdent: users.basketIdent })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const basketIdent = userResult[0]?.basketIdent;
      console.log(
        `[BasketService] Found basket ident for user ${userId}: ${basketIdent}`
      );
      return basketIdent ?? null; // 명시적으로 null 반환
    } catch (error) {
      console.error(
        `[BasketService] Error fetching basket ident for user ${userId}:`,
        error
      );
      // 프로덕션 환경에서는 더 구체적인 에러 로깅 또는 처리가 필요할 수 있습니다.
      return null; // 오류 발생 시 null 반환하여 장바구니 없음으로 처리
    }
  }

  /**
   * 사용자의 Tebex 장바구니를 확인하고, 없으면 생성하여 DB에 basketIdent를 저장합니다.
   * @param userId 사용자 ID (NextAuth 세션에서 얻은 ID)
   * @returns {Promise<{success: boolean, ident?: string | null, error?: string}>} 작업 성공 여부, basketIdent, 에러 메시지
   */
  async ensureUserBasket(userId: string): Promise<{
    success: boolean;
    ident?: string | null;
    error?: string;
  }> {
    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    // TODO: 실제 리디렉션 URL로 변경 필요
    const completeUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`
      : "/checkout/success";
    const cancelUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`
      : "/checkout/cancel";

    try {
      // 1. DB에서 사용자의 basketIdent 확인
      const userResult = await db
        .select({ basketIdent: users.basketIdent })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const existingIdent = userResult[0]?.basketIdent;

      if (existingIdent) {
        console.log(
          `[BasketService] Found existing basket ident for user ${userId}: ${existingIdent}`
        );
        // TODO: 필요시 Tebex API로 ident 유효성 검사 추가
        return { success: true, ident: existingIdent };
      }

      // 2. basketIdent가 없으면 Tebex에서 새로 생성
      console.log(
        `[BasketService] No basket ident found for user ${userId}. Creating a new basket...`
      );
      // lib/tebex.ts 의 createBasket 함수 사용 (URL 인수 추가)
      const basketResponse = await createBasket(completeUrl, cancelUrl);

      if (!basketResponse || !basketResponse.ident) {
        console.error(
          "[BasketService] Failed to create basket in Tebex:",
          basketResponse
        );
        return {
          success: false,
          error: "Failed to create basket via Tebex API.",
        };
      }

      const newIdent = basketResponse.ident;
      console.log(
        `[BasketService] Created new basket with ident: ${newIdent} for user ${userId}`
      );

      // 3. 생성된 ident를 DB에 업데이트
      await db
        .update(users)
        .set({ basketIdent: newIdent, updatedAt: new Date() })
        .where(eq(users.id, userId));

      console.log(
        `[BasketService] Successfully updated basket ident for user ${userId}`
      );

      return { success: true, ident: newIdent };
    } catch (error) {
      console.error(
        `[BasketService] Error ensuring user basket for ${userId}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while managing the basket.",
      };
    }
  }
}

// Export an instance of the service
export const basketService = new BasketService();

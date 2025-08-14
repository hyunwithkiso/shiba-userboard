import { db, users, accounts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { createBasket } from "@/lib/tebex"; // Tebex API 함수 임포트

/**
 * 사용자의 Tebex 장바구니를 확인하고, 없으면 생성하여 DB에 basketIdent를 저장합니다.
 * @param userId 사용자 ID (NextAuth 세션에서 얻은 ID)
 * @returns {Promise<{success: boolean, ident?: string | null, error?: string}>} 작업 성공 여부, basketIdent, 에러 메시지
 */
export async function ensureUserBasket(userId: string): Promise<{
  success: boolean;
  ident?: string | null;
  error?: string;
}> {
  if (!userId) {
    return { success: false, error: "User ID is required." };
  }

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
    // lib/tebex.ts 의 createBasket 함수 사용
    const basketResponse = await createBasket(
      process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000/checkout/success",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/checkout/cancel"
    );

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

// user-service.ts (기존 클래스)
class UserService {
  async getUserByUserId(userId: string) {
    const user = await db
      .select({
        id: users.id,
        discordId: accounts.providerAccountId,
        nickname: users.nickname,
        role: users.roles,
        isInit: users.isInit,
        basketIdent: users.basketIdent, // basketIdent도 선택하도록 추가
      })
      .from(users)
      .leftJoin(
        accounts,
        and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
      )
      .where(eq(users.id, userId));
    return user;
  }

  /**
   * 사용자의 userId가 설정되어 있는지 확인합니다.
   * @param id 사용자의 ID (NextAuth ID)
   * @returns userId 존재 여부와 사용자 정보
   */
  async checkUserIdExists(id: string): Promise<{
    success: boolean;
    hasUserId: boolean;
    user?: any;
    error?: string;
  }> {
    if (!id) {
      return { success: false, hasUserId: false, error: "사용자 ID가 필요합니다." };
    }

    try {
      const user = await db
        .select({
          id: users.id,
          userId: users.userId,
          nickname: users.nickname,
          discordId: accounts.providerAccountId,
        })
        .from(users)
        .leftJoin(
          accounts,
          and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
        )
        .where(eq(users.id, id))
        .limit(1);

      if (user.length === 0) {
        return { 
          success: false, 
          hasUserId: false, 
          error: "사용자를 찾을 수 없습니다." 
        };
      }

      const userData = user[0];
      const hasUserId = !!userData.userId;

      return {
        success: true,
        hasUserId,
        user: userData,
      };
    } catch (error) {
      console.error(`[UserService] Error checking userId for ${id}:`, error);
      return {
        success: false,
        hasUserId: false,
        error: error instanceof Error ? error.message : "사용자 정보 확인 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 사용자의 userId(고유번호)를 변경합니다.
   * @param id 사용자의 ID (NextAuth ID)
   * @param newUserId 새로운 userId
   * @returns 성공 여부
   */
  async updateUserId(id: string, newUserId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!id || !newUserId) {
      return { success: false, error: "ID와 새로운 고유번호가 필요합니다." };
    }

    try {
      // 새로운 userId가 이미 사용 중인지 확인
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.userId, newUserId))
        .limit(1);

      if (existingUser.length > 0) {
        return { success: false, error: "이미 사용 중인 고유번호입니다." };
      }

      // userId 업데이트
      await db
        .update(users)
        .set({ userId: newUserId, updatedAt: new Date() })
        .where(eq(users.id, id));

      console.log(`[UserService] Successfully updated userId for ${id} to ${newUserId}`);
      return { success: true };
    } catch (error) {
      console.error(`[UserService] Error updating userId for ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "고유번호 변경 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 사용자의 전체 정보를 가져옵니다.
   * @param id 사용자의 ID (NextAuth ID)
   * @returns 사용자 정보
   */
  async getUserInfo(id: string): Promise<{
    success: boolean;
    user?: {
      id: string;
      email: string | null;
      name: string | null;
      image: string | null;
      nickname: string | null;
      userId: string | null;
      discordId: string | null;
      isAdmin: boolean;
      isInit: boolean;
      basketIdent: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    error?: string;
  }> {
    if (!id) {
      return { success: false, error: "사용자 ID가 필요합니다." };
    }

    try {
      const userResult = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          nickname: users.nickname,
          userId: users.userId,
          discordId: accounts.providerAccountId,
          isAdmin: users.isAdmin,
          isInit: users.isInit,
          basketIdent: users.basketIdent,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .leftJoin(
          accounts,
          and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
        )
        .where(eq(users.id, id))
        .limit(1);

      if (userResult.length === 0) {
        return { success: false, error: "사용자를 찾을 수 없습니다." };
      }

      const user = userResult[0];
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          nickname: user.nickname,
          userId: user.userId,
          discordId: user.discordId,
          isAdmin: user.isAdmin ?? false,
          isInit: user.isInit ?? false,
          basketIdent: user.basketIdent,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      console.error(`[UserService] Error fetching user info for ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "사용자 정보 조회 중 오류가 발생했습니다.",
      };
    }
  }
}

export const userService = new UserService();

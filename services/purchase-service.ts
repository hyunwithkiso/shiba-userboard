import { purchases, users } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// 구매 내역 상세 타입 (스키마 기반, 필요시 확장)
export type PurchaseDetail = typeof purchases.$inferSelect & {
  user?: typeof users.$inferSelect | null;
};

class PurchaseService {
  /**
   * Basket Identifier를 사용하여 특정 구매 내역을 조회합니다.
   * @param basketIdent Tebex 장바구니 식별자
   * @returns {Promise<PurchaseDetail | null>} 해당 구매 내역 또는 null
   */
  async getPurchaseByBasketIdent(
    basketIdent: string
  ): Promise<PurchaseDetail | null> {
    if (!basketIdent) return null;

    try {
      const result = await db
        .select()
        .from(purchases)
        .where(eq(purchases.basketIdent, basketIdent))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(
        `[PurchaseService] Error fetching purchase by basketIdent ${basketIdent}:`,
        error
      );
      throw new Error("구매 내역 조회 중 오류가 발생했습니다.");
    }
  }

  /**
   * 특정 사용자의 모든 구매 내역을 조회합니다 (페이지네이션 추가 가능).
   * @param userId 사용자 ID
   * @returns {Promise<PurchaseDetail[]>} 구매 내역 목록
   */
  async getUserPurchases(userId: string): Promise<PurchaseDetail[]> {
    if (!userId) return [];

    try {
      const result = await db
        .select()
        .from(purchases)
        .where(eq(purchases.userId, userId))
        .orderBy(desc(purchases.createdAt)); // 최신순 정렬

      return result;
    } catch (error) {
      console.error(
        `[PurchaseService] Error fetching purchases for user ${userId}:`,
        error
      );
      throw new Error("구매 내역 조회 중 오류가 발생했습니다.");
    }
  }
}

export const purchaseService = new PurchaseService();

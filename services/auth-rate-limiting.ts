import { authAttempts } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { headers } from "next/headers";

interface AuthAttemptData {
  userId: string;
  discordId: string;
  attemptType: "init" | "reauth";
  success: boolean;
  errorMessage?: string;
}

interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts?: number;
  resetTime?: Date;
  message?: string;
}

export class AuthRateLimitingService {
  // 설정값들
  private static readonly MAX_ATTEMPTS_PER_HOUR = 5; // 시간당 최대 5회 시도
  private static readonly MAX_ATTEMPTS_PER_DAY = 15; // 일일 최대 15회 시도
  private static readonly LOCKOUT_DURATION_MINUTES = 60; // 1시간 잠금
  private static readonly CLEANUP_DAYS = 30; // 30일 후 기록 정리

  /**
   * 인증 시도를 기록합니다
   */
  static async recordAttempt(data: AuthAttemptData): Promise<void> {
    try {
      const headersList = await headers();
      const ipAddress = headersList.get("x-forwarded-for") || 
                       headersList.get("x-real-ip") || 
                       "unknown";
      const userAgent = headersList.get("user-agent") || "unknown";

      await db.insert(authAttempts).values({
        userId: data.userId,
        discordId: data.discordId,
        attemptType: data.attemptType,
        success: data.success,
        errorMessage: data.errorMessage,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      });

      console.log(`[AuthRateLimit] 인증 시도 기록됨: User ${data.userId}, Type: ${data.attemptType}, Success: ${data.success}`);
    } catch (error) {
      console.error("[AuthRateLimit] 인증 시도 기록 실패:", error);
      // 기록 실패가 인증 과정을 차단하면 안되므로 에러를 던지지 않음
    }
  }

  /**
   * 사용자의 인증 시도 제한을 확인합니다
   */
  static async checkRateLimit(userId: string, discordId: string): Promise<RateLimitCheck> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 최근 1시간 내 시도 횟수 확인 (실패한 시도만)
      const recentFailedAttempts = await db
        .select()
        .from(authAttempts)
        .where(
          and(
            eq(authAttempts.userId, userId),
            eq(authAttempts.success, false),
            gte(authAttempts.createdAt, oneHourAgo)
          )
        )
        .orderBy(desc(authAttempts.createdAt));

      // 최근 24시간 내 총 시도 횟수 확인
      const dailyAttempts = await db
        .select()
        .from(authAttempts)
        .where(
          and(
            eq(authAttempts.userId, userId),
            gte(authAttempts.createdAt, oneDayAgo)
          )
        )
        .orderBy(desc(authAttempts.createdAt));

      // 시간당 제한 확인
      if (recentFailedAttempts.length >= this.MAX_ATTEMPTS_PER_HOUR) {
        const oldestRecentAttempt = recentFailedAttempts[recentFailedAttempts.length - 1];
        const resetTime = new Date(oldestRecentAttempt.createdAt.getTime() + 60 * 60 * 1000);
        
        return {
          allowed: false,
          resetTime,
          message: `너무 많은 실패한 시도가 있었습니다. ${this.formatResetTime(resetTime)} 후에 다시 시도해주세요.`
        };
      }

      // 일일 제한 확인
      if (dailyAttempts.length >= this.MAX_ATTEMPTS_PER_DAY) {
        const oldestDailyAttempt = dailyAttempts[dailyAttempts.length - 1];
        const resetTime = new Date(oldestDailyAttempt.createdAt.getTime() + 24 * 60 * 60 * 1000);
        
        return {
          allowed: false,
          resetTime,
          message: `일일 인증 시도 제한에 도달했습니다. ${this.formatResetTime(resetTime)} 후에 다시 시도해주세요.`
        };
      }

      // 최근 성공한 인증이 5분 이내에 있었는지 확인 (중복 방지)
      const recentSuccessfulAttempt = await db
        .select()
        .from(authAttempts)
        .where(
          and(
            eq(authAttempts.userId, userId),
            eq(authAttempts.success, true),
            gte(authAttempts.createdAt, new Date(now.getTime() - 5 * 60 * 1000))
          )
        )
        .limit(1);

      if (recentSuccessfulAttempt.length > 0) {
        return {
          allowed: false,
          message: "최근에 인증이 완료되었습니다. 잠시 후 다시 시도해주세요."
        };
      }

      // 제한에 걸리지 않음 - 허용
      const remainingHourlyAttempts = this.MAX_ATTEMPTS_PER_HOUR - recentFailedAttempts.length;
      const remainingDailyAttempts = this.MAX_ATTEMPTS_PER_DAY - dailyAttempts.length;
      
      return {
        allowed: true,
        remainingAttempts: Math.min(remainingHourlyAttempts, remainingDailyAttempts)
      };

    } catch (error) {
      console.error("[AuthRateLimit] 제한 확인 실패:", error);
      // 에러 발생 시 일단 허용 (서비스 중단 방지)
      return { allowed: true };
    }
  }

  /**
   * 사용자의 최근 인증 시도 기록을 조회합니다
   */
  static async getUserRecentAttempts(userId: string, limit: number = 10) {
    try {
      return await db
        .select()
        .from(authAttempts)
        .where(eq(authAttempts.userId, userId))
        .orderBy(desc(authAttempts.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("[AuthRateLimit] 사용자 시도 기록 조회 실패:", error);
      return [];
    }
  }

  /**
   * 오래된 인증 시도 기록을 정리합니다 (관리자 작업)
   */
  static async cleanupOldAttempts(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_DAYS);

      const result = await db
        .delete(authAttempts)
        .where(
          gte(authAttempts.createdAt, cutoffDate)
        );

      console.log(`[AuthRateLimit] ${this.CLEANUP_DAYS}일 이전 기록 정리 완료`);
      return result.length || 0;
    } catch (error) {
      console.error("[AuthRateLimit] 기록 정리 실패:", error);
      return 0;
    }
  }

  /**
   * 시간을 사용자 친화적으로 포맷합니다
   */
  private static formatResetTime(resetTime: Date): string {
    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMinutes <= 0) {
      return "지금";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분`;
    } else {
      const diffHours = Math.ceil(diffMinutes / 60);
      return `${diffHours}시간`;
    }
  }

  /**
   * 관리자용: 특정 사용자의 제한을 리셋합니다
   */
  static async resetUserLimits(userId: string): Promise<boolean> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      await db
        .delete(authAttempts)
        .where(
          and(
            eq(authAttempts.userId, userId),
            gte(authAttempts.createdAt, oneDayAgo)
          )
        );

      console.log(`[AuthRateLimit] 사용자 ${userId}의 제한이 리셋되었습니다`);
      return true;
    } catch (error) {
      console.error("[AuthRateLimit] 사용자 제한 리셋 실패:", error);
      return false;
    }
  }
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AuthRateLimitingService } from "@/services/auth-rate-limiting";
import { userService } from "@/services/user-service";

// 사용자의 현재 rate limit 상태 확인
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const getUserInfo = await userService.getUserInfo(session.user.id);
    const discordId = getUserInfo.user?.discordId;
    if (!discordId) {
      return NextResponse.json(
        { success: false, error: "Discord ID를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const rateLimitCheck = await AuthRateLimitingService.checkRateLimit(
      session.user.id,
      discordId
    );

    return NextResponse.json({
      success: true,
      allowed: rateLimitCheck.allowed,
      remainingAttempts: rateLimitCheck.remainingAttempts,
      resetTime: rateLimitCheck.resetTime,
      message: rateLimitCheck.message
    });

  } catch (error) {
    console.error("[API:rate-limit-status] 상태 확인 실패:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
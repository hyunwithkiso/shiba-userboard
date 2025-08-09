import { NextRequest, NextResponse } from "next/server";
import { checkCurrentUserAdmin } from "@/lib/user-validation";
import { AuthRateLimitingService } from "@/services/auth-rate-limiting";

// 관리자용: 인증 시도 기록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (userId) {
      // 특정 사용자의 기록 조회
      const attempts = await AuthRateLimitingService.getUserRecentAttempts(userId, limit);
      return NextResponse.json({
        success: true,
        attempts,
        total: attempts.length
      });
    } else {
      // 전체 기록 조회는 보안상 제한
      return NextResponse.json(
        { success: false, error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("[API:auth-attempts] 인증 시도 조회 실패:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 관리자용: 사용자의 인증 제한 리셋
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await AuthRateLimitingService.resetUserLimits(userId);
    
    return NextResponse.json({
      success: result,
      message: result ? "사용자의 인증 제한이 리셋되었습니다." : "제한 리셋에 실패했습니다."
    });

  } catch (error) {
    console.error("[API:auth-attempts] 인증 제한 리셋 실패:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
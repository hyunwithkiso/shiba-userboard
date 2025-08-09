import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentUserData } from "@/lib/user-validation";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          hasUserId: false, 
          isAdmin: false,
          error: "인증이 필요합니다." 
        },
        { status: 401 }
      );
    }

    const userData = await getCurrentUserData();

    if (!userData) {
      return NextResponse.json(
        { 
          success: false, 
          hasUserId: false, 
          isAdmin: false,
          error: "사용자를 찾을 수 없습니다." 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasUserId: !!userData.userId,
      isAdmin: userData.isAdmin,
      userId: userData.userId,
      nickname: userData.nickname,
      user: userData
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { 
        success: false, 
        hasUserId: false, 
        isAdmin: false,
        error: "서버 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }
}
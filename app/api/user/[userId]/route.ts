import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 해당 userId를 가진 사용자 찾기
    const userResult = await db
      .select({
        id: users.id,
        nickname: users.nickname,
        email: users.email,
        name: users.name,
        userId: users.userId
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: "해당 userId를 가진 사용자가 존재하지 않습니다.",
        user: null
      });
    }

    const user = userResult[0];

    return NextResponse.json({
      success: true,
      exists: true,
      message: "사용자를 찾았습니다.",
      user: {
        id: user.id,
        userId: user.userId,
        nickname: user.nickname,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error("[API] user check 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        exists: false,
        error: "서버 오류가 발생했습니다.",
        user: null
      },
      { status: 500 }
    );
  }
}

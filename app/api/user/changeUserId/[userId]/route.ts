import { NextRequest, NextResponse } from "next/server";
import { users } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const start = Date.now();
  try {
    console.log(`[changeUserId] PUT start ts=${new Date().toISOString()}`);
    console.log(`[changeUserId] request.method=${request.method} url=${request.url}`);

    // API 키 인증 체크 (대시보드에서 서버-투-서버 호출)
    const apiKey = request.headers.get('X-API-Key');
    const envKey = process.env.EXTERNAL_API_KEY;
    const mask = (v: string | null | undefined) => {
      if (!v) return v;
      if (v.length <= 8) return `${v}`;
      return `${v.slice(0, 4)}...${v.slice(-4)}`;
    };
    console.log(`[changeUserId] header.X-API-Key=${mask(apiKey)} env.EXTERNAL_API_KEY=${mask(envKey)}`);
    if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
      console.log(`[changeUserId] 401 invalid api key`);
      return NextResponse.json(
        { success: false, error: "유효하지 않은 API 키입니다." },
        { status: 401 }
      );
    }

    const { userId } = await params;
    console.log(`[changeUserId] params.userId=${userId}`);
    const body = await request.json();
    const { newUserId } = body;
    console.log(`[changeUserId] body.newUserId=${newUserId}`);

    if (!newUserId) {
      console.log(`[changeUserId] 400 newUserId missing`);
      return NextResponse.json(
        { success: false, error: "새로운 userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 userId를 가진 사용자 찾기
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    console.log(`[changeUserId] existingUser.length=${existingUser.length}`);

    if (existingUser.length === 0) {
      console.log(`[changeUserId] 404 user not found for userId=${userId}`);
      return NextResponse.json(
        { success: false, error: "해당 userId를 가진 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 새로운 userId가 이미 사용 중인지 확인
    const duplicateCheck = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, newUserId))
      .limit(1);
    console.log(`[changeUserId] duplicateCheck.length=${duplicateCheck.length}`);

    if (duplicateCheck.length > 0) {
      console.log(`[changeUserId] 409 newUserId already in use newUserId=${newUserId}`);
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 userId입니다." },
        { status: 409 }
      );
    }

    // userId 업데이트
    await db
      .update(users)
      .set({
        userId: newUserId,
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));
    console.log(`[changeUserId] update done userId=${userId} -> newUserId=${newUserId}`);

    // 외부 API 호출 로그 기록
    console.log(`[API] External changeUserId: ${userId} → ${newUserId}`);

    return NextResponse.json({
      success: true,
      message: "userId가 성공적으로 변경되었습니다.",
      oldUserId: userId,
      newUserId: newUserId
    });

  } catch (error) {
    console.error("[API] changeUserId 오류:", error);
    console.log(`[changeUserId] PUT failed in ${(Date.now() - start)}ms`);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

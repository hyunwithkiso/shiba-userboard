import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { newUserId } = body;

    if (!newUserId) {
      return NextResponse.json(
        { success: false, error: "새로운 userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 userId를 가진 사용자 찾기
    const existingUser = await db
      .select({ id: users.id, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "해당 userId를 가진 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const targetUser = existingUser[0];

    // 권한 확인: 본인이거나 관리자여야 함
    const currentUser = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const isAdmin = currentUser[0]?.isAdmin ?? false;
    const isSelf = targetUser.id === session.user.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 새로운 userId가 이미 사용 중인지 확인
    const duplicateCheck = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, newUserId))
      .limit(1);

    if (duplicateCheck.length > 0) {
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

    return NextResponse.json({
      success: true,
      message: "userId가 성공적으로 변경되었습니다.",
      oldUserId: userId,
      newUserId: newUserId
    });

  } catch (error) {
    console.error("[API] changeUserId 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

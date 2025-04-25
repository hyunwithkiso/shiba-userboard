"use server";

import { auth } from "@/lib/auth";
import { db, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// init-form 에서 전달받는 Discord 역할 객체 타입
type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

/**
 * 초기 설정 후 사용자의 닉네임과 Discord 역할을 데이터베이스에 업데이트합니다.
 * @param userId 업데이트할 사용자의 ID.
 * @param nickname 저장할 Discord 닉네임.
 * @param discordRoles Discord 역할 객체의 배열.
 * @returns 성공 또는 실패를 나타내는 객체.
 */
export async function updateUserMetadataAction(
  userId: string,
  nickname: string,
  discordRoles: DiscordRole[] // 역할 객체 배열을 직접 받음
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // 권한 확인: 사용자가 자신의 프로필을 업데이트하는지 확인
    if (!currentUserId || currentUserId !== userId) {
      return { success: false, error: "권한 없는 접근입니다." };
    }

    // 입력값 유효성 검사
    if (
      !userId ||
      typeof nickname !== "string" ||
      !Array.isArray(discordRoles)
    ) {
      return {
        success: false,
        error: "잘못된 입력: userId, nickname, discordRoles 배열이 필요합니다.",
      };
    }

    console.log(
      `[Action:updateUserMetadata] 사용자 ${userId}의 닉네임 및 역할 업데이트 중`
    );

    // 'roles' (text[]) 컬럼에 저장할 역할 이름 추출
    const roleNames = discordRoles.map((role) => role.name);

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof users.$inferInsert> = {
      nickname: nickname, // schema.ts 에 추가된 nickname 컬럼 사용
      roles: roleNames, // schema.ts 의 roles 컬럼 (text[]) 사용
      updatedAt: new Date(), // updatedAt 필드 갱신
    };

    await db.update(users).set(updateData).where(eq(users.id, userId));

    console.log(
      `[Action:updateUserMetadata] 사용자 ${userId}의 닉네임 및 역할 업데이트 성공`
    );

    return { success: true };
  } catch (error) {
    console.error(
      `[Action:updateUserMetadata] 사용자 ${userId}의 닉네임 및 역할 업데이트 실패`,
      error
    );
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

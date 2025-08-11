"use server";

import { auth } from "@/lib/auth";
import { userService } from "@/services/user-service";
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

/**
 * 관리자가 사용자의 고유번호(userId)를 변경합니다.
 * @param targetUserId 변경할 사용자의 ID (NextAuth ID)
 * @param newUserId 새로운 고유번호
 * @returns 성공 또는 실패를 나타내는 객체
 */
export async function updateUserIdAction(
  targetUserId: string,
  newUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const isAdmin = await userService.getUserInfo(session.user.id);

    if (!isAdmin.success || !isAdmin.user?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." };
    }

    // 입력값 유효성 검사
    if (!targetUserId || !newUserId) {
      return {
        success: false,
        error: "사용자 ID와 새로운 고유번호가 필요합니다.",
      };
    }

    // 고유번호 형식 검사 (숫자만 허용)
    if (!/^\d+$/.test(newUserId)) {
      return {
        success: false,
        error: "고유번호는 숫자만 입력 가능합니다.",
      };
    }

    console.log(
      `[Action:updateUserId] 관리자 ${session.user?.id}가 사용자 ${targetUserId}의 고유번호를 ${newUserId}로 변경 시도`
    );

    // 서비스 호출
    const result = await userService.updateUserId(targetUserId, newUserId);

    if (result.success) {
      // 페이지 새로고침
      revalidatePath("/admin/users");
      console.log(
        `[Action:updateUserId] 사용자 ${targetUserId}의 고유번호 변경 성공`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `[Action:updateUserId] 고유번호 변경 실패`,
      error
    );
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

/**
 * 현재 로그인한 사용자의 정보를 가져옵니다.
 * @returns 사용자 정보
 */
export async function getCurrentUserInfo() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const result = await userService.getUserInfo(session.user.id);
    return result;
  } catch (error) {
    console.error("[Action:getCurrentUserInfo] 사용자 정보 조회 실패", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

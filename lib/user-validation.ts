import { auth } from "@/lib/auth";
import { db, users, accounts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

/**
 * 현재 세션 사용자의 실시간 DB 정보를 가져옵니다
 */
export async function getCurrentUserData() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const userData = await db
      .select({
        id: users.id,
        userId: users.userId,
        isAdmin: users.isAdmin,
        discordId: accounts.providerAccountId,
        nickname: users.nickname,
        isInit: users.isInit,
      })
      .from(users)
      .leftJoin(
        accounts,
        and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
      )
      .where(eq(users.id, session.user.id))
      .limit(1);

    return userData[0] || null;
  } catch (error) {
    console.error("[UserValidation] Error fetching user data:", error);
    return null;
  }
}

/**
 * 현재 사용자가 관리자인지 확인합니다
 */
export async function checkCurrentUserAdmin(): Promise<boolean> {
  const userData = await getCurrentUserData();
  return userData?.isAdmin ?? false;
}

/**
 * 현재 사용자의 userId가 있는지 확인합니다
 */
export async function checkCurrentUserHasUserId(): Promise<boolean> {
  const userData = await getCurrentUserData();
  return !!userData?.userId;
}

/**
 * 현재 사용자의 userId를 가져옵니다
 */
export async function getCurrentUserId(): Promise<string | null> {
  const userData = await getCurrentUserData();
  return userData?.userId || null;
}

/**
 * 현재 사용자가 초기화되었는지 확인합니다
 */
export async function checkCurrentUserInit(): Promise<boolean> {
  const userData = await getCurrentUserData();
  return userData?.isInit ?? false;
}

/**
 * 관리자 권한 검증 (리다이렉트 포함)
 */
export async function requireAdmin() {
  const isAdmin = await checkCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("ADMIN_REQUIRED");
  }
  return true;
}

/**
 * userId 존재 검증 (리다이렉트 포함)
 */
export async function requireUserId() {
  const hasUserId = await checkCurrentUserHasUserId();
  if (!hasUserId) {
    throw new Error("USER_ID_REQUIRED");
  }
  return true;
}
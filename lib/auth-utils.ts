import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userService } from "@/services/user-service";
import { users } from "@/lib/schema";
import { db } from "@/lib/db"; // Import db and users table
import { eq } from "drizzle-orm"; // Import eq operator

/**
 * 현재 로그인된 사용자의 초기화 상태(isInit)를 확인합니다.
 * 만약 초기화되지 않았거나 사용자 정보를 찾을 수 없으면 '/init' 페이지로 리다이렉트합니다.
 * @throws {Error} 세션 정보를 가져오지 못하거나 데이터베이스 조회 중 오류 발생 시
 */
export async function checkUserInitialization(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // 이론적으로 여기까지 오면 안 되지만, 안전하게 로그인 페이지로 리다이렉트
    console.warn(
      "[AuthUtils] No user ID found in session. Redirecting to login."
    );
    redirect("/login");
  }

  try {
    const users = await userService.getUserByUserId(userId);
    const user = users[0]; // getUserByUserId는 배열을 반환

    if (!user || !user.isInit) {
      console.log(
        `[AuthUtils] User ${userId} is not initialized (isInit: ${user?.isInit}). Redirecting to /init.`
      );
      redirect("/init");
    }

    // isInit이 true이면 아무것도 하지 않음 (정상 진행)
    console.log(`[AuthUtils] User ${userId} is initialized. Proceeding.`);
  } catch (error) {
    console.error("[AuthUtils] Error checking user initialization:", error);
    // 데이터베이스 오류 등 심각한 문제 발생 시 에러 페이지로 리다이렉트하거나 오류 처리
    // 여기서는 일단 /init으로 보내는 것이 안전할 수 있음 (상황에 따라 결정)
    // 또는 특정 에러 페이지로 리다이렉트
    // throw new Error('Failed to check user initialization status.');
    redirect("/error?message=user_check_failed"); // 예시 에러 페이지
  }
}

/**
 * 현재 로그인된 사용자가 관리자인지 확인합니다.
 * @returns {Promise<boolean>} 관리자 여부 (true/false)
 * @throws {Error} 세션 정보를 가져오지 못하거나 데이터베이스 조회 중 오류 발생 시
 */
export async function checkAdmin(): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    console.warn("[AuthUtils] No user ID found in session for admin check.");
    return false; // 로그인되지 않은 사용자는 관리자가 아님
  }

  try {
    // userService를 사용하거나 직접 쿼리할 수 있습니다.
    // 여기서는 직접 쿼리하여 isAdmin 필드만 가져옵니다.
    const userResult = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isAdmin = userResult[0]?.isAdmin ?? false;
    console.log(`[AuthUtils] Admin check for user ${userId}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error("[AuthUtils] Error checking admin status:", error);
    // 오류 발생 시 안전하게 false 반환 또는 에러 throw (상황에 따라 결정)
    // throw new Error('Failed to check admin status.');
    return false;
  }
}

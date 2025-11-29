"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation"; // redirect는 현재 사용되지 않으므로 주석 처리 또는 제거
import { notices, users } from "@/lib/schema";
import { db } from "@/lib/db"; // users는 직접 사용되지 않으므로 제거 가능
import { eq, sql } from "drizzle-orm";
import { checkAdmin } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";
// import { SerializedEditorState } from "lexical"; // Editor state type 제거

// 입력 스키마 정의 (Zod 사용)
const noticeSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요.")
    .max(100, "제목은 100자 이내로 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."), // content를 string으로 변경
  isPinned: z.boolean().optional(),
});

// --- 공지사항 생성 액션 ---
export async function createNoticeAction(formData: FormData) {
  // 1. 관리자 권한 확인
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { success: false, error: "관리자 권한이 없습니다." };
  }

  // 2. 사용자 정보 가져오기 (authorId)
  const session = await auth();
  const userId = session?.user?.id;
  // const userNickname = session?.user?.name; // 세션에서 닉네임 가져오는 부분 제거

  if (!userId) {
    return { success: false, error: "사용자 인증 정보를 찾을 수 없습니다." };
  }

  // 2.1. DB에서 사용자 닉네임 조회
  let dbUserNickname: string | null = null;
  try {
    const userResult = await db
      .select({ nickname: users.nickname })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (userResult.length > 0 && userResult[0].nickname) {
      dbUserNickname = userResult[0].nickname;
    } else {
      // 사용자를 찾지 못하거나 닉네임이 없는 경우 에러 처리 또는 기본값 사용
      console.warn(
        `[Action:createNotice] User nickname not found in DB for userId: ${userId}`
      );
      // 기본 닉네임 또는 세션 닉네임 사용 등의 fallback 로직 추가 가능
      // 여기서는 에러로 처리
      return {
        success: false,
        error: "작성자 닉네임을 데이터베이스에서 찾을 수 없습니다.",
      };
    }
  } catch (dbError) {
    console.error(
      "[Action:createNotice] Error fetching user nickname:",
      dbError
    );
    return { success: false, error: "작성자 정보 조회 중 오류 발생" };
  }

  // 3. 입력 데이터 유효성 검사
  const content = formData.get("content") as string;

  const validatedFields = noticeSchema.safeParse({
    title: formData.get("title"),
    content: content,
    isPinned: formData.get("isPinned") === "true",
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      success: false,
      error: "입력값을 확인해주세요.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    title: validatedTitle,
    content: validatedContent,
    isPinned,
  } = validatedFields.data;

  // 4. 데이터베이스에 저장
  try {
    await db.insert(notices).values({
      title: validatedTitle,
      content: validatedContent,
      authorId: userId,
      nickname: dbUserNickname, // DB에서 조회한 닉네임 사용
      isPinned: isPinned ?? false,
    });

    console.log("[Action:createNotice] Notice created successfully.");

    // 5. 캐시 무효화 및 결과 반환
    revalidatePath("/notices");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Action:createNotice] Error creating notice:", error);
    return {
      success: false,
      error: "공지사항 생성 중 오류가 발생했습니다.",
    };
  }
}

// --- 공지사항 수정 액션 ---
export async function updateNoticeAction(noticeId: string, formData: FormData) {
  // 1. 관리자 권한 확인
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { success: false, error: "관리자 권한이 없습니다." };
  }

  // 2. 입력 데이터 유효성 검사
  const content = formData.get("content") as string; // content 직접 가져오기
  // JSON.parse 로직 제거

  const validatedFields = noticeSchema.safeParse({
    title: formData.get("title"),
    content: content, // 직접 가져온 content 사용
    isPinned: formData.get("isPinned") === "true",
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      success: false,
      error: "입력값을 확인해주세요.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    title: validatedTitle,
    content: validatedContent,
    isPinned,
  } = validatedFields.data; // 변수명 충돌 방지

  // 3. 데이터베이스 업데이트
  try {
    // Optional: Check if notice exists before update
    const existingNotice = await db
      .select({ id: notices.id })
      .from(notices)
      .where(eq(notices.id, noticeId))
      .limit(1);

    if (existingNotice.length === 0) {
      return { success: false, error: "수정할 공지사항을 찾을 수 없습니다." };
    }

    await db
      .update(notices)
      .set({
        title: validatedTitle,
        content: validatedContent, // 타입 캐스팅 제거
        isPinned: isPinned ?? false,
        updatedAt: new Date(),
      })
      .where(eq(notices.id, noticeId));

    console.log(
      `[Action:updateNotice] Notice ${noticeId} updated successfully.`
    );

    // 4. 캐시 무효화 및 결과 반환
    revalidatePath("/notices");
    revalidatePath(`/notices/${noticeId}`);
    revalidatePath("/"); // 홈 캐시도 무효화 (선택적)
    return { success: true };
  } catch (error) {
    console.error(
      `[Action:updateNotice] Error updating notice ${noticeId}:`,
      error
    );
    return {
      success: false,
      error: "공지사항 수정 중 오류가 발생했습니다.",
    };
  }
}

// TODO: 공지사항 삭제 액션 (필요시 추가)
// 삭제 기능을 구현하려면 이 부분을 활성화하고 로직을 추가하세요.
// export async function deleteNoticeAction(noticeId: string) {
//   const isAdmin = await checkAdmin();
//   if (!isAdmin) {
//     return { success: false, error: "관리자 권한이 없습니다." };
//   }
//   try {
//     await db.delete(notices).where(eq(notices.id, noticeId));
//     console.log(`[Action:deleteNotice] Notice ${noticeId} deleted successfully.`);
//     revalidatePath("/notices");
//     revalidatePath("/"); // 홈 캐시도 무효화 (선택적)
//     return { success: true };
//   } catch (error) {
//     console.error(`[Action:deleteNotice] Error deleting notice ${noticeId}:`, error);
//     return { success: false, error: "공지사항 삭제 중 오류가 발생했습니다." };
//   }
// }

export async function incrementNoticeViewCount(id: string) {
  try {
    await db
      .update(notices)
      .set({ viewCount: sql`${notices.viewCount} + 1` })
      .where(eq(notices.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error incrementing notice view count:", error);
    return { success: false, error: "Failed to increment view count" };
  }
}

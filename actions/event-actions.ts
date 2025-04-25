"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, events, users } from "@/lib/schema"; // users 테이블 import 추가
import { eq } from "drizzle-orm";
import { checkAdmin } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";

// 입력 스키마 정의 (Zod 사용)
const eventSchema = z
  .object({
    title: z
      .string()
      .min(1, "제목을 입력해주세요.")
      .max(100, "제목은 100자 이내"),
    content: z.string().min(1, "내용을 입력해주세요."),
    thumbnailImage: z
      .string()
      .url("유효한 이미지 URL을 입력해주세요.")
      .or(z.literal(""))
      .optional(), // Optional URL or empty string
    startDate: z.date({
      errorMap: () => ({ message: "유효한 시작일을 입력해주세요." }),
    }),
    endDate: z.date({
      errorMap: () => ({ message: "유효한 종료일을 입력해주세요." }),
    }),
    isPinned: z.boolean().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "종료일은 시작일보다 빠를 수 없습니다.",
    path: ["endDate"], // 에러 메시지를 endDate 필드에 연결
  });

// --- 이벤트 생성 액션 ---
export async function createEventAction(formData: FormData) {
  // 1. 관리자 권한 확인
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { success: false, error: "관리자 권한이 없습니다." };
  }

  // 2. 사용자 정보 가져오기 (authorId)
  const session = await auth();
  const userId = session?.user?.id;
  // const userNickname = session?.user?.name; // 세션 닉네임 제거

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
      console.warn(
        `[Action:createEvent] User nickname not found in DB for userId: ${userId}`
      );
      return {
        success: false,
        error: "작성자 닉네임을 데이터베이스에서 찾을 수 없습니다.",
      };
    }
  } catch (dbError) {
    console.error(
      "[Action:createEvent] Error fetching user nickname:",
      dbError
    );
    return { success: false, error: "작성자 정보 조회 중 오류 발생" };
  }

  // 3. 입력 데이터 유효성 검사
  const content = formData.get("content") as string;

  // startDate, endDate를 Date 객체로 파싱
  const startDateString = formData.get("startDate") as string | null;
  const endDateString = formData.get("endDate") as string | null;
  let startDate, endDate;
  try {
    if (!startDateString || !endDateString) {
      throw new Error("Start date or end date is missing.");
    }
    startDate = new Date(startDateString);
    endDate = new Date(endDateString);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date format provided.");
    }
  } catch (dateError: any) {
    console.error("[Action:createEvent] Invalid date format:", dateError);
    return {
      success: false,
      error: "날짜 형식이 잘못되었습니다.",
      errors: {
        startDate: ["유효한 시작일을 입력해주세요."],
        endDate: ["유효한 종료일을 입력해주세요."],
      },
    };
  }

  const validatedFields = eventSchema.safeParse({
    title: formData.get("title"),
    content: content,
    thumbnailImage: formData.get("thumbnailImage") || undefined,
    startDate: startDate, // 파싱된 Date 객체 사용
    endDate: endDate, // 파싱된 Date 객체 사용
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
    thumbnailImage,
    startDate: validatedStartDate, // 변수명 구분
    endDate: validatedEndDate, // 변수명 구분
    isPinned,
  } = validatedFields.data;

  // 4. 데이터베이스에 저장
  try {
    await db.insert(events).values({
      title: validatedTitle,
      content: validatedContent,
      thumbnailImage: thumbnailImage || null,
      startDate: validatedStartDate,
      endDate: validatedEndDate,
      authorId: userId,
      nickname: dbUserNickname, // DB 닉네임 사용
      isPinned: isPinned ?? false,
    });

    console.log("[Action:createEvent] Event created successfully.");

    // 5. 캐시 무효화 및 결과 반환
    revalidatePath("/events");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Action:createEvent] Error creating event:", error);
    return {
      success: false,
      error: "이벤트 생성 중 오류가 발생했습니다.",
    };
  }
}

// --- 이벤트 수정 액션 ---
export async function updateEventAction(eventId: string, formData: FormData) {
  // 1. 관리자 권한 확인
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { success: false, error: "관리자 권한이 없습니다." };
  }

  // 2. 입력 데이터 유효성 검사
  const content = formData.get("content") as string;

  const validatedFields = eventSchema.safeParse({
    title: formData.get("title"),
    content: content,
    thumbnailImage: formData.get("thumbnailImage") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
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
    thumbnailImage,
    startDate,
    endDate,
    isPinned,
  } = validatedFields.data;

  // 3. 데이터베이스 업데이트
  try {
    // Check if event exists
    const existingEvent = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (existingEvent.length === 0) {
      return { success: false, error: "수정할 이벤트를 찾을 수 없습니다." };
    }

    await db
      .update(events)
      .set({
        title: validatedTitle,
        content: validatedContent,
        thumbnailImage: thumbnailImage || null,
        startDate: startDate,
        endDate: endDate,
        isPinned: isPinned ?? false,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    console.log(`[Action:updateEvent] Event ${eventId} updated successfully.`);

    // 4. 캐시 무효화 및 결과 반환
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(
      `[Action:updateEvent] Error updating event ${eventId}:`,
      error
    );
    return {
      success: false,
      error: "이벤트 수정 중 오류가 발생했습니다.",
    };
  }
}

// TODO: 이벤트 삭제 액션 (필요시 추가)

import { auth } from "@/lib/auth";
import { db, users } from "@/lib/schema";
import { killfeedSubmission, chatTitleSubmission } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import mysql from "@/lib/mysql";
import { revalidatePath } from "next/cache";

// gameDbMetadata 타입 정의 수정 (schema.ts와 일치)
interface Metadata {
  width?: string; // 예: "100px"
  scale?: number; // 예: 0.7 (70%)
  margin?: string; // 예: "-3px -10px 0px -10px" (Top Right Bottom Left)
  // marginTop, marginRight, marginBottom, marginLeft 제거됨
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "관리자만 접근할 수 있습니다." },
        { status: 401 }
      );
    }
    const adminUserId = session.user.id;

    // 요청 본문 타입 캐스팅 시 업데이트된 Metadata 인터페이스 사용
    const data = await req.json();
    const { imageId, type, status, adminNotes, metadata } = data as {
      imageId: string;
      type: "killfeed" | "chat";
      status: "approved" | "rejected";
      adminNotes?: string;
      metadata?: Metadata; // 업데이트된 Metadata 타입
    };

    if (!imageId || !type || !status) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        {
          error:
            "유효하지 않은 상태값입니다. 'approved' 또는 'rejected'여야 합니다.",
        },
        { status: 400 }
      );
    }

    let submissionData;
    let userGameId: string | null = null;

    if (type === "killfeed") {
      const result = await db
        .select({
          submission: killfeedSubmission,
          userGameId: users.userId,
          code: killfeedSubmission.code,
        })
        .from(killfeedSubmission)
        .where(eq(killfeedSubmission.id, imageId))
        .leftJoin(users, eq(killfeedSubmission.userId, users.id))
        .limit(1);
      if (result.length > 0) {
        submissionData = result[0].submission;
        userGameId = result[0].userGameId;
      }
    } else if (type === "chat") {
      const result = await db
        .select({
          submission: chatTitleSubmission,
          userGameId: users.userId,
          code: chatTitleSubmission.code,
        })
        .from(chatTitleSubmission)
        .where(eq(chatTitleSubmission.id, imageId))
        .leftJoin(users, eq(chatTitleSubmission.userId, users.id))
        .limit(1);
      if (result.length > 0) {
        submissionData = result[0].submission;
        userGameId = result[0].userGameId;
      }
    } else {
      return NextResponse.json(
        { error: "유효하지 않은 이미지 타입입니다." },
        { status: 400 }
      );
    }

    if (!submissionData) {
      return NextResponse.json(
        { error: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (submissionData.status !== "pending") {
      return NextResponse.json(
        { error: "이미 처리 대기중인 이미지가 아닙니다." },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      status,
      reviewerId: adminUserId,
      reviewedAt: new Date(),
      adminNotes: adminNotes || null,
    };

    let finalGameDbMetadata = submissionData.gameDbMetadata;

    if (type === "chat" && status === "approved" && metadata) {
      finalGameDbMetadata = metadata; // 받은 metadata 객체 사용
      updatePayload.gameDbMetadata = finalGameDbMetadata;
      console.log("Chat-title metadata update:", {
        imageId,
        receivedMetadata: metadata,
      });
    } else if (type === "chat" && status === "approved" && !metadata) {
      console.log(
        "Chat-title approved without metadata update, using existing:",
        finalGameDbMetadata
      );
    }

    if (type === "killfeed") {
      await db
        .update(killfeedSubmission)
        .set(updatePayload)
        .where(eq(killfeedSubmission.id, submissionData.id));
    } else {
      await db
        .update(chatTitleSubmission)
        .set(updatePayload)
        .where(eq(chatTitleSubmission.id, submissionData.id));
    }

    if (status === "approved") {
      try {
        // submissionData에서 code, gameDbName, gameDbFileName 사용 확인
        if (
          !submissionData.code ||
          !submissionData.gameDbName ||
          !submissionData.gameDbFileName
        ) {
          console.error(`필수 게임 DB 정보 누락 for imageId: ${imageId}`);
          throw new Error("게임 DB 저장을 위한 필수 정보가 누락되었습니다.");
        }

        const query = `
            INSERT INTO dokku_userboard (code, name, type, image, metadata)
            VALUES (?, ?, ?, ?, ?)
          `;

        const metadataString = JSON.stringify(finalGameDbMetadata);

        const values = [
          type === "killfeed"
            ? "killfeed_" + submissionData.code
            : "chattitle_" + submissionData.code,
          submissionData.gameDbName,
           type === "killfeed" ? "killfeed" : "chattitle",
          submissionData.gameDbFileName,
          metadataString,
        ];

        console.log("게임 DB 저장 중:", { query, values });

        await mysql.execute(query, values);

        console.log("게임 DB에 이미지 정보가 저장되었습니다:", {
          code: submissionData.code,
          userId: userGameId,
        });
      } catch (error) {
        console.error("게임 DB 저장 중 오류:", error);
        return NextResponse.json(
          { error: "승인되었으나 게임 DB 저장 중 오류 발생" },
          { status: 500 }
        );
      }
    }

    revalidatePath("/admin/images");
    revalidatePath("/my-uploads");

    const statusMessage = status === "approved" ? "승인" : "거부";
    return NextResponse.json({
      success: true,
      message: `이미지가 성공적으로 ${statusMessage}되었습니다.`,
    });
  } catch (error) {
    console.error("Error in image approval:", error);
    return NextResponse.json(
      { error: "이미지 승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

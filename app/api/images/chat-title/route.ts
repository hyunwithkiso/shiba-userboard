import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, chatTitleSubmission } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { generateRandomCode } from "@/lib/utils";
import { realtimeService } from "@/services/realtime-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 관리자 여부 확인
    const isAdmin = !!session.user.isAdmin;

    // 티켓 차감 먼저 시도
    if (!isAdmin) {
      const updateResult = await realtimeService.updateChatTitleAmount(
        session.user.id
      );
      if (!updateResult.success) {
        return NextResponse.json(
          {
            error:
              "채팅 칭호 티켓이 부족하거나 차감에 실패했습니다. 티켓을 확인해 주세요.",
          },
          { status: 400 }
        );
      }
    }

    // Content-Type 확인
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    // formData 처리
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("FormData 파싱 오류:", error);
      return NextResponse.json(
        { error: "FormData 처리 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File;
    const name = formData.get("name") as string | null;
    const metadataStr = formData.get("metadata") as string | null;
    let metadata: { width?: string; scale?: number; margin?: string } = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        return NextResponse.json(
          { error: "메타데이터 파싱 오류" },
          { status: 400 }
        );
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "이미지 이름이 필요합니다." },
        { status: 400 }
      );
    }

    if (name.length > 10) {
      return NextResponse.json(
        { error: "이미지 이름은 최대 10자까지 가능합니다." },
        { status: 400 }
      );
    }

    // 이름 중복 검사
    const existingImage = await db
      .select({ id: chatTitleSubmission.id })
      .from(chatTitleSubmission)
      .where(eq(chatTitleSubmission.name, name.trim()))
      .limit(1);

    if (existingImage.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 이미지 이름입니다. 다른 이름을 사용해주세요." },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (500KB)
    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 500KB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    const allowedTypes = ["image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    // 파일을 외부 API로 업로드
    const externalFormData = new FormData();
    externalFormData.append("files", file);
    externalFormData.append("bucket", "game");
    externalFormData.append("folder", "chat-title");

    let response;
    try {
      response = await fetch("https://screenshot.dokku.co.kr/files?type=chat", {
        method: "POST",
        body: externalFormData,
      });
    } catch (error) {
      console.error("외부 API 업로드 오류:", error);
      return NextResponse.json(
        { error: "이미지 업로드 중 네트워크 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: "응답을 파싱할 수 없습니다." };
      }

      return NextResponse.json(
        { error: errorData.error || "이미지 업로드 실패" },
        { status: response.status }
      );
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error("응답 파싱 오류:", error);
      return NextResponse.json(
        { error: "업로드 응답을 파싱할 수 없습니다." },
        { status: 500 }
      );
    }

    const uploadedUrl = responseData.url;

    if (!uploadedUrl) {
      return NextResponse.json(
        { error: "업로드 응답에서 이미지 URL을 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    // DB에 제출 정보 저장
    const submission = await db
      .insert(chatTitleSubmission)
      .values({
        userId: session.user.id,
        name: name.trim(),
        filePath: uploadedUrl,
        fileName: responseData.fileName,
        fileType: file.type,
        fileSize: file.size,
        status: "pending",
        code: generateRandomCode(),
        gameDbName: name.trim(),
        gameDbFileName: responseData.fileName,
        gameDbMetadata: metadata,
      })
      .returning();

    revalidatePath("/dashboard");

    return NextResponse.json({
      url: uploadedUrl,
      submission: submission[0],
    });
  } catch (error) {
    console.error("[Chat Title Upload Error]:", error);
    return NextResponse.json(
      {
        error: "이미지 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

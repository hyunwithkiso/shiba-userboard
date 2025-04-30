import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/schema";
import { killfeedSubmission } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { generateRandomCode } from "@/lib/utils";
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    // 사용자 확인
    const user = session.user;

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

    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
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
      .select({ id: killfeedSubmission.id })
      .from(killfeedSubmission)
      .where(eq(killfeedSubmission.name, name.trim()))
      .limit(1);

    if (existingImage.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 이미지 이름입니다. 다른 이름을 사용해주세요." },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (500KB 이하)
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 500KB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    const validTypes = ["image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "지원되는 파일 형식은 PNG, WebP, GIF입니다." },
        { status: 400 }
      );
    }

    // 외부 API로 업로드할 FormData 생성
    const externalFormData = new FormData();
    externalFormData.append("files", file);
    externalFormData.append("bucket", "game");
    externalFormData.append("folder", "killfeed");

    // 외부 API로 이미지 업로드
    const uploadUrl = "https://screenshot.dokku.co.kr/files?type=killfeed";
    let response;
    try {
      response = await fetch(uploadUrl, {
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

    // 응답에서 URL 추출
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

    // DB에 이미지 정보 저장
    const newSubmission = await db
      .insert(killfeedSubmission)
      .values({
        userId: user.id,
        code: generateRandomCode(),
        name: name.trim(),
        filePath: uploadedUrl,
        fileName: responseData.fileName,
        fileType: file.type,
        fileSize: file.size,
        status: "pending",
        gameDbName: name.trim(),
        gameDbFileName: responseData.fileName,
      })
      .returning();

    // 경로 갱신
    revalidatePath("/dashboard");

    // 응답 반환
    return NextResponse.json({
      url: uploadedUrl,
      submission: newSubmission[0],
    });
  } catch (error) {
    console.error("킬피드 이미지 업로드 오류:", error);
    return NextResponse.json(
      {
        error: "이미지 업로드 중 서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

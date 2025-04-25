import { auth } from "@/lib/auth";
import { db } from "@/lib/schema";
import { killfeedSubmission, chatTitleSubmission } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import mysql from "@/lib/mysql";
import { nanoid } from "nanoid";

// URL에서 이미지를 가져와 File 객체로 변환하는 함수
async function urlToFile(
  url: string,
  filename: string,
  mimeType: string
): Promise<File> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Error converting URL to File:", error);
    throw error;
  }
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

    // Content-Type 확인
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    // formData 처리
    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error("FormData 파싱 오류:", error);
      return NextResponse.json(
        { error: "FormData 처리 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File;
    const imageId = formData.get("imageId") as string;
    const type = formData.get("type") as "killfeed" | "chat";
    const scale = formData.get("scale")
      ? Number(formData.get("scale"))
      : undefined;
    const imageName = formData.get("name") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    // 이미지 URL이 제공된 경우, URL에서 파일을 가져옵니다.
    let fileToUpload: File = file;
    if (imageUrl && !file) {
      try {
        const fileName = imageUrl.split("/").pop() || "image.webp";
        const mimeType = fileName.endsWith(".webp")
          ? "image/webp"
          : fileName.endsWith(".png")
          ? "image/png"
          : fileName.endsWith(".gif")
          ? "image/gif"
          : "image/webp";

        fileToUpload = await urlToFile(imageUrl, fileName, mimeType);
        console.log(`URL에서 파일로 변환 성공: ${fileName}, ${mimeType}`);
      } catch (error) {
        console.error("URL에서 파일로 변환 실패:", error);
        return NextResponse.json(
          { error: "이미지 URL에서 파일을 생성하는데 실패했습니다." },
          { status: 400 }
        );
      }
    }

    if (!fileToUpload || !imageId || !type) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!imageName || imageName.trim() === "") {
      return NextResponse.json(
        { error: "이미지 이름이 필요합니다." },
        { status: 400 }
      );
    }

    if (imageName.length > 10) {
      return NextResponse.json(
        { error: "이미지 이름은 최대 10자까지 가능합니다." },
        { status: 400 }
      );
    }

    // 기존 이미지 조회
    let existingImage;
    if (type === "killfeed") {
      existingImage = await db
        .select()
        .from(killfeedSubmission)
        .where(eq(killfeedSubmission.id, imageId));
    } else if (type === "chat") {
      existingImage = await db
        .select()
        .from(chatTitleSubmission)
        .where(eq(chatTitleSubmission.id, imageId));
    } else {
      return NextResponse.json(
        { error: "잘못된 이미지 타입입니다." },
        { status: 400 }
      );
    }

    if (!existingImage) {
      return NextResponse.json(
        { error: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미지 업로드
    const formDataToSend = new FormData();
    formDataToSend.append("file", fileToUpload);
    formDataToSend.append("type", type);

    let uploadResponse;
    try {
      uploadResponse = await fetch(
        `https://screenshot.dokku.co.kr/files?type=${type}`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );
    } catch (error) {
      console.error("외부 API 업로드 오류:", error);
      return NextResponse.json(
        { error: "이미지 업로드 중 네트워크 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!uploadResponse.ok) {
      let errorData;
      try {
        errorData = await uploadResponse.json();
      } catch (e) {
        errorData = { error: "응답을 파싱할 수 없습니다." };
      }

      return NextResponse.json(
        { error: errorData.error || "이미지 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    let uploadResult;
    try {
      uploadResult = await uploadResponse.json();
    } catch (error) {
      console.error("응답 파싱 오류:", error);
      return NextResponse.json(
        { error: "업로드 응답을 파싱할 수 없습니다." },
        { status: 500 }
      );
    }

    // 파일 이름 추출 (URL에서 마지막 부분을 파일 이름으로 사용)
    const fileName = uploadResult.url.split("/").pop();

    // DB 업데이트
    const updateData = {
      name: imageName.trim(),
      filePath: uploadResult.url,
      fileName: fileToUpload.name,
      fileType: fileToUpload.type,
      fileSize: fileToUpload.size,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
      ...(type === "chat" && {
        scale: scale ?? 70,
      }),
    };

    if (type === "killfeed") {
      await db
        .update(killfeedSubmission)
        .set(updateData)
        .where(eq(killfeedSubmission.id, imageId));
    } else {
      await db
        .update(chatTitleSubmission)
        .set(updateData)
        .where(eq(chatTitleSubmission.id, imageId));
    }

    // 게임 데이터베이스에 이미지 정보 저장
    try {
      // 랜덤 코드 생성 (예: killfeed_a1b2c3 또는 chattitle_x7y8z9)
      const randomSuffix = nanoid(6);
      const code = `${type}_${randomSuffix}`;

      // 메타데이터 설정
      const metadata = JSON.stringify({
        scale: type === "chat" ? scale : 0.7,
        margin: "-3px -12px 0",
      });

      // MySQL 쿼리 실행
      const query = `
        INSERT INTO dokku_images (id, code, name, type, image, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        1, // 임시로 1로 고정 (추후 사용자 ID로 변경 필요)
        code,
        imageName.trim() +
          "님의 " +
          (type === "killfeed" ? "킬피드" : "채팅 칭호"),
        type,
        fileName,
        metadata,
      ];

      await mysql.execute(query, values);

      console.log("게임 DB에 이미지 정보가 저장되었습니다:", code);
    } catch (mysqlError) {
      console.error("게임 DB 저장 오류:", mysqlError);
      // 게임 DB 저장 실패해도 API 응답은 성공으로 처리
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in image edit:", error);
    return NextResponse.json(
      { error: "이미지 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/auth";
import { db, users } from "@/lib/schema";
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

    const data = await req.json();
    const { imageId, type, status, adminNotes, scale } = data;

    if (!imageId || !type || !status) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // status 값 검증
    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        {
          error:
            "유효하지 않은 상태값입니다. 'approved' 또는 'rejected'여야 합니다.",
        },
        { status: 400 }
      );
    }

    // 이미지 정보 조회
    let existingImage;
    if (type === "killfeed") {
      existingImage = await db
        .select()
        .from(killfeedSubmission)
        .where(eq(killfeedSubmission.id, imageId))
        .leftJoin(users, eq(killfeedSubmission.userId, users.id))
        .limit(1);
    } else if (type === "chat") {
      existingImage = await db
        .select()
        .from(chatTitleSubmission)
        .where(eq(chatTitleSubmission.id, imageId))
        .leftJoin(users, eq(chatTitleSubmission.userId, users.id))
        .limit(1);
    } else {
      return NextResponse.json(
        { error: "유효하지 않은 이미지 타입입니다." },
        { status: 400 }
      );
    }

    if (!existingImage || existingImage.length === 0) {
      return NextResponse.json(
        { error: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const image = existingImage[0];

    // 이미 처리된 이미지인지 확인
    if (image.status === "approved" || image.status === "rejected") {
      return NextResponse.json(
        { error: "이미 처리된 이미지입니다." },
        { status: 400 }
      );
    }

    // 상태 업데이트 데이터
    const updateData = {
      status,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
      adminNotes: adminNotes || null,
    };

    // DB 상태 업데이트
    if (type === "killfeed") {
      await db
        .update(killfeedSubmission)
        .set(updateData)
        .where(eq(killfeedSubmission.id, imageId));
    } else {
      // chat 타입인 경우 scale 정보도 함께 업데이트
      // scale은 0-1 사이의 값으로 전달되므로 100을 곱해서 DB에 저장
      // scale 값이 없으면 기존 값 유지 (undefined 처리)
      const updateDataWithScale =
        scale !== undefined
          ? { ...updateData, scale: Math.round(scale * 100) }
          : updateData;

      console.log("Chat-title scale update:", {
        originalScale: scale,
        dbScale: scale !== undefined ? Math.round(scale * 100) : "undefined",
        imageId,
      });

      await db
        .update(chatTitleSubmission)
        .set(updateDataWithScale)
        .where(eq(chatTitleSubmission.id, imageId));
    }

    // 승인된 경우에만 MySQL DB에 저장
    if (status === "approved") {
      try {
        // 제출자 userId 확인 (존재하지 않으면 null 처리)
        const submitterId = image.users.userId || null;

        if (!submitterId) {
          console.warn(
            `이미지 ${imageId}에 사용자 ID가 없습니다. 기본값을 사용합니다.`
          );
        }

        // 파일명 추출
        const fileName = image.filePath.split("/").pop() || "image.webp";
        let uploadedFileName = fileName;

        // killfeed 타입인 경우 이미지 업로드 진행
        if (type === "killfeed") {
          const mimeType = fileName.endsWith(".webp")
            ? "image/webp"
            : fileName.endsWith(".png")
            ? "image/png"
            : fileName.endsWith(".gif")
            ? "image/gif"
            : "image/webp";

          const fileObj = await urlToFile(image.filePath, fileName, mimeType);

          // 스크린샷 서비스에 이미지 업로드
          const formDataToSend = new FormData();
          formDataToSend.append("files", fileObj);
          formDataToSend.append("bucket", "game");
          formDataToSend.append("folder", type);

          const uploadResponse = await fetch(
            `https://screenshot.dokku.co.kr/files?type=${type}`,
            {
              method: "POST",
              body: formDataToSend,
            }
          );

          if (!uploadResponse.ok) {
            throw new Error("스크린샷 서비스 업로드 실패");
          }

          const uploadResult = await uploadResponse.json();
          const uploadedUrl = uploadResult.url;
          uploadedFileName = uploadedUrl.split("/").pop();
        }

        // 랜덤 코드 생성 (예: killfeed_a1b2c3 또는 chattitle_x7y8z9)
        const randomSuffix = nanoid(6);
        const code = `${type}_${randomSuffix}`;

        // 메타데이터 설정 - chat 타입인 경우 scale 값 설정
        // scale 값은 0-1 사이 값으로 변환해서 저장
        let metadataScale = scale;

        // 승인 과정에서 조절한 scale 값이 없으면 DB에서 가져온 값 사용
        if (metadataScale === undefined) {
          metadataScale = image.scale ? image.scale / 100 : 0.7;
        }

        console.log("Metadata scale:", {
          metadataScale,
          originalScale: scale,
          imageScale: image.scale,
        });

        const metadata =
          type === "chat"
            ? JSON.stringify({ scale: metadataScale, margin: "-3px -12px 0" })
            : JSON.stringify({});

        // MySQL 쿼리 실행
        const query = `
          INSERT INTO dokku_userboard (id, code, name, type, image, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
          submitterId || 1, // 제출자 ID 사용, 없으면 1로 대체
          code,
          image.name + "님의 " + (type === "killfeed" ? "킬피드" : "채팅 칭호"),
          type === "killfeed" ? "killfeed" : "chattitle",
          uploadedFileName,
          metadata,
        ];

        await mysql.execute(query, values);

        console.log("게임 DB에 이미지 정보가 저장되었습니다:", {
          code,
          userId: submitterId || 1,
        });
      } catch (error) {
        console.error("이미지 처리 중 오류:", error);
        // 이미지 처리 실패해도 승인 상태는 유지
      }
    }

    // 상태에 따른 메시지 설정
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

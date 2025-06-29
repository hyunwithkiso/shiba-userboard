import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { realtimeService } from "@/services/realtime-service";
import { imageService } from "@/services/image-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const metadataStr = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "이미지 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    // 메타데이터 파싱
    let metadata = {
      width: "100px",
      scale: 0.7,
      marginTop: -5,
      marginRight: -10,
      marginBottom: 0,
      marginLeft: -10,
    };

    if (metadataStr) {
      try {
        const parsedMetadata = JSON.parse(metadataStr);
        metadata = { ...metadata, ...parsedMetadata };
      } catch (error) {
        console.error("메타데이터 파싱 오류:", error);
      }
    }

    // 파일 타입 검증
    const allowedTypes = ["image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "PNG, WebP, GIF 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (200KB)
    if (file.size > 200 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 200KB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const gameUserId = Number(session.user.userId); // 게임 유저 ID
    const isAdmin = !!session.user.isAdmin;

    // 티켓 확인 (관리자는 제외)
    if (!isAdmin) {
      const ticketInfo = await realtimeService.getCheckAvailableChatTitle(gameUserId);
      if (ticketInfo.amount <= 0) {
        return NextResponse.json(
          { error: "채팅 칭호 이용권이 부족합니다." },
          { status: 400 }
        );
      }
    }

    // 외부 API로 업로드할 FormData 생성
    const externalFormData = new FormData();
    externalFormData.append("files", file);
    externalFormData.append("bucket", "game");
    externalFormData.append("folder", "chatTitle");

    // 외부 API로 이미지 업로드
    const uploadUrl = "https://screenshot.dokku.co.kr/files?type=chatTitle";
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
    const fileName = responseData.fileName;

    if (!uploadedUrl || !fileName) {
      return NextResponse.json(
        { error: "업로드 응답에서 필요한 정보를 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    // MySQL의 dokku_userboard 테이블에 직접 저장
    try {
      const result = await imageService.createImageSubmission({
        userId: gameUserId, // 게임 유저 ID 사용
        name: name.trim(),
        type: "chattitle",
        fileName: fileName,
        metadata: metadata // 채팅칭호 메타데이터 포함
      });

      // 응답 반환
      return NextResponse.json({
        message: "채팅 칭호가 성공적으로 업로드되었습니다. 관리자 검토 후 게임에 적용됩니다.",
        url: uploadedUrl,
        submission: {
          id: result.id,
          code: result.code,
          name: name.trim(),
          fileName: fileName,
          filePath: uploadedUrl,
          status: "pending", // 프론트엔드 호환성을 위해
          scale: Math.round(metadata.scale * 100), // 프론트엔드 호환성
          marginX: metadata.marginRight, // 프론트엔드 호환성
          gameDbMetadata: metadata
        }
      });
    } catch (error: any) {
      console.error("DB 저장 오류:", error);
      return NextResponse.json(
        { error: error.message || "데이터베이스 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Chat title upload error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

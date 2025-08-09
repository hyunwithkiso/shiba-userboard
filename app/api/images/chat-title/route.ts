import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentUserId } from "@/lib/user-validation";
import { realtimeService } from "@/services/realtime-service";
import { imageService } from "@/services/image-service";
import { UploadService } from "@/services/upload-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
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

    const gameUserId = Number(userId); // 게임 유저 ID

    // 티켓 확인 (모든 사용자 대상)
    const ticketInfo = await realtimeService.getCheckAvailableChatTitle(gameUserId);
    if (ticketInfo.amount <= 0) {
      return NextResponse.json(
        { error: "채팅 칭호 이용권이 부족합니다." },
        { status: 400 }
      );
    }

    // UploadService를 사용한 이미지 업로드
    const uploadResult = await UploadService.uploadToExternalStorage({
      file,
      type: "chat-title"
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 400 }
      );
    }

    const { url: uploadedUrl, fileName } = uploadResult;

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

      // DB 저장 성공 후 티켓 차감
      try {
        await realtimeService.updateChatTitleAmount(String(gameUserId));
        console.log(`[ChatTitleAPI] Ticket deducted for user ${gameUserId}`);
      } catch (ticketError) {
        console.error("[ChatTitleAPI] Error deducting ticket:", ticketError);
        // 티켓 차감 실패 시에도 업로드는 성공으로 처리 (이미 DB에 저장됨)
        // 관리자가 수동으로 처리할 수 있도록 로그만 남김
      }

      // 업로드 완료 (pending 상태) - 승인 시에만 refreshUserBoardItem 호출됨
      console.log(`[ChatTitleAPI] Chat title uploaded successfully for user ${gameUserId}, insert_id: ${result.id} (pending approval)`);

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

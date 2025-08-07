import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { realtimeService } from "@/services/realtime-service";
import { imageService } from "@/services/image-service";
import { UploadService } from "@/services/upload-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

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

    const gameUserId = Number(session.user.userId); // 게임 유저 ID

    // 티켓 확인 (모든 사용자 대상)
    const ticketInfo = await realtimeService.getCheckAvailableKillFeed(gameUserId);
    if (ticketInfo.amount <= 0) {
      return NextResponse.json(
        { error: "킬피드 이용권이 부족합니다." },
        { status: 400 }
      );
    }

    // UploadService를 사용한 이미지 업로드
    const uploadResult = await UploadService.uploadToExternalStorage({
      file,
      type: "killfeed"
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
        type: "killfeed",
        fileName: fileName,
        metadata: {} // 킬피드는 추가 메타데이터 없음
      });

      // DB 저장 성공 후 티켓 차감
      try {
        await realtimeService.updateKillFeedAmount(String(gameUserId));
        console.log(`[KillfeedAPI] Ticket deducted for user ${gameUserId}`);
      } catch (ticketError) {
        console.error("[KillfeedAPI] Error deducting ticket:", ticketError);
        // 티켓 차감 실패 시에도 업로드는 성공으로 처리 (이미 DB에 저장됨)
        // 관리자가 수동으로 처리할 수 있도록 로그만 남김
      }

      // 응답 반환
      return NextResponse.json({
        message: "킬피드가 성공적으로 업로드되었습니다. 관리자 검토 후 게임에 적용됩니다.",
        url: uploadedUrl,
        submission: {
          id: result.id,
          code: result.code,
          name: name.trim(),
          fileName: fileName,
          filePath: uploadedUrl,
          status: "pending" // 프론트엔드 호환성을 위해
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
    console.error("Killfeed upload error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

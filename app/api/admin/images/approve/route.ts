import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { imageService } from "@/services/image-service";
import { realtimeService } from "@/services/realtime-service";

// gameDbMetadata 타입 정의
interface Metadata {
  width?: string; // 예: "100px"
  scale?: number; // 예: 0.7 (70%)
  margin?: string; // 예: "-3px -10px 0px -10px" (Top Right Bottom Left)
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
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

    // 요청 본문 파싱
    const data = await req.json();
    const { imageId, type, status, adminNotes, metadata } = data as {
      imageId: string | number;
      type: "killfeed" | "chat";
      status: "approved" | "rejected";
      adminNotes?: string;
      metadata?: Metadata;
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

    // imageId를 number로 변환
    const numericImageId = typeof imageId === 'string' ? parseInt(imageId) : imageId;
    
    if (isNaN(numericImageId)) {
      return NextResponse.json(
        { error: "유효하지 않은 이미지 ID입니다." },
        { status: 400 }
      );
    }

    // 이미지 정보 조회
    const submission = await imageService.getImageSubmission(numericImageId);
    
    if (!submission) {
      return NextResponse.json(
        { error: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 처리된 이미지인지 확인
    // - 거절된 이미지는 추가 조작 불가
    // - 승인된 이미지는 메타데이터 수정을 허용 (status가 approved로 다시 들어올 때)
    if (submission.approved !== 0) {
      if (submission.approved === 1 && status === "approved" && type === "chat") {
        // 승인된 채팅 칭호이지만 메타데이터 수정 요청이므로 허용
        console.log("[AdminApproval] Approved chat-title metadata update", {
          imageId: numericImageId,
          metadata,
        });
      } else {
        const statusText = submission.approved === 1 ? "승인" : "거절";
        return NextResponse.json(
          { error: `이미 ${statusText}된 이미지입니다.` },
          { status: 400 }
        );
      }
    }

    // 승인 상태 업데이트
    let finalMetadata = submission.metadata;
    
    if (type === "chat" && status === "approved" && metadata) {
      // 채팅칭호의 경우 메타데이터 업데이트 가능
      finalMetadata = metadata;
      console.log("Chat-title metadata update:", {
        imageId: numericImageId,
        receivedMetadata: metadata,
      });
    }

    const updateSuccess = await imageService.updateApprovalStatus(
      numericImageId,
      status,
      finalMetadata,
      adminNotes
    );

    if (!updateSuccess) {
      return NextResponse.json(
        { error: "승인 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    // 승인된 경우 게임 서버에 유저보드 아이템 갱신 알림
    if (status === "approved" && submission.user_id) {
      try {
        // 최초 승인인지 확인 (이전에 승인되지 않았던 경우 isNew = true)
        const isNew = submission.approved !== 1;
        
        await imageService.refreshUserBoardItem({
          insert_id: numericImageId,
          user_id: submission.user_id,
          isNew: isNew
        });
        console.log(`[AdminApproval] User board item refreshed for user ${submission.user_id}, isNew: ${isNew}`);
      } catch (refreshError) {
        console.error("[AdminApproval] Error refreshing user board item:", refreshError);
        // 갱신 알림 실패해도 승인 처리는 성공으로 간주
        // 관리자가 수동으로 처리할 수 있도록 로그만 남김
      }
    }

    // 거절된 경우 티켓 롤백 (관리자가 아닌 사용자만)
    if (status === "rejected" && submission.user_id) {
      try {
        // type에 따라 적절한 롤백 함수 호출
        if (type === "killfeed") {
          await realtimeService.rollBackKillFeedAmount(String(submission.user_id));
          console.log(`[AdminApproval] KillFeed ticket rolled back for user ${submission.user_id}`);
        } else if (type === "chat") {
          await realtimeService.rollBackChatTitleAmount(String(submission.user_id));
          console.log(`[AdminApproval] ChatTitle ticket rolled back for user ${submission.user_id}`);
        }
      } catch (rollbackError) {
        console.error("[AdminApproval] Error rolling back ticket:", rollbackError);
        // 롤백 실패해도 승인/거절 처리는 성공으로 간주
        // 관리자가 수동으로 처리할 수 있도록 로그만 남김
      }
    }

    // adminNotes는 이제 reason 컬럼에 저장됨

    // 캐시 재검증
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

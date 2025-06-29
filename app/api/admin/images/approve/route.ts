import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { imageService } from "@/services/image-service";

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
    if (submission.approved !== 0) {
      const statusText = submission.approved === 1 ? "승인" : "거절";
      return NextResponse.json(
        { error: `이미 ${statusText}된 이미지입니다.` },
        { status: 400 }
      );
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
      finalMetadata
    );

    if (!updateSuccess) {
      return NextResponse.json(
        { error: "승인 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    // 승인 거부 시 adminNotes를 별도로 처리하려면 추가 로직 필요
    // 현재 dokku_userboard 테이블에는 adminNotes 필드가 없음

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

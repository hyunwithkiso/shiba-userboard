import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user-service";
import { UploadService } from "@/services/upload-service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 관리자만 업로드 가능 (이벤트 폼은 관리자 페이지에서만 접근 가능)
    const me = await userService.getUserInfo(session.user.id);
    if (!me.success || !me.user?.isAdmin) {
      return NextResponse.json({ error: "관리자만 업로드할 수 있습니다." }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("files") as File | null;
    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    // 갤러리 업로드 서비스와 동일 저장소/프로세스로 업로드 (비율/크기 제한 없음)
    const uploaded = await UploadService.uploadGalleryFile(file);
    if (!uploaded.success || !uploaded.url) {
      return NextResponse.json({ error: uploaded.error || "업로드 실패" }, { status: 400 });
    }

    return NextResponse.json({ url: uploaded.url, fileName: uploaded.fileName, success: true });
  } catch (error) {
    console.error("[UploadAPI] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
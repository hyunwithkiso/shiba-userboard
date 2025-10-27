import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { userService } from "@/services/user-service";
import { galleryService } from "@/services/gallery-service";

async function tryDeleteFromStorage(url: string) {
  try {
    const u = new URL(url);
    const name = u.pathname.split("/").filter(Boolean).pop();
    if (!name) return;
    // 외부 스토리지 삭제 시도 (갤러리용 엔드포인트 가정)
    await fetch(
      `https://screenshot.dokku.co.kr/delete?type=gallery&path=${encodeURIComponent(name)}`,
      { method: "GET", cache: "no-store" }
    ).catch(() => { });
  } catch { }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    const me = await userService.getUserInfo(session.user.id);
    if (!me.success || !me.user?.isAdmin) {
      return NextResponse.json({ error: "관리자만 가능합니다." }, { status: 403 });
    }

    const id = await params.then((p) => p.id);
    const item = await galleryService.getById(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 스토리지 삭제는 베스트 에포트
    if (item.url) {
      tryDeleteFromStorage(item.url).catch(() => { });
    }

    // DB에서 제거
    // drizzle에 직접 delete가 필요하나, galleryService에 메서드가 없다면 여기서 처리
    const { db, gallery } = await import("@/lib/schema");
    const { eq } = await import("drizzle-orm");
    await db.delete(gallery).where(eq(gallery.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AdminGalleryDelete] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}


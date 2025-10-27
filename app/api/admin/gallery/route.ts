import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { userService } from "@/services/user-service";
import { galleryService } from "@/services/gallery-service";
import sharp from "sharp";

function isHttpUrl(u: string) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const me = await userService.getUserInfo(session.user.id);
    if (!me.success || !me.user?.isAdmin) {
      return NextResponse.json({ error: "관리자만 업로드할 수 있습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const url = body?.url as string | undefined;
    const title = (body?.title as string | undefined) ?? null;

    if (!url || !isHttpUrl(url)) {
      return NextResponse.json({ error: "유효한 이미지 URL을 입력하세요." }, { status: 400 });
    }

    // 원격 이미지 가져와서 16:9 비율 검사
    let width: number | undefined;
    let height: number | undefined;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json({ error: "이미지를 가져올 수 없습니다." }, { status: 400 });
      }
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height) {
        return NextResponse.json({ error: "이미지 메타데이터를 확인할 수 없습니다." }, { status: 400 });
      }
      width = meta.width;
      height = meta.height;
      const ratio = width / height;
      const target = 16 / 9;
      const tolerance = 0.02; // 약 2% 오차 허용
      if (Math.abs(ratio - target) > tolerance) {
        return NextResponse.json(
          { error: "이미지는 16:9 비율이어야 합니다." },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error("[GalleryUpload] Validation error:", e);
      return NextResponse.json({ error: "이미지 확인 중 오류가 발생했습니다." }, { status: 400 });
    }

    // 저장
    const created = await galleryService.create({
      url,
      title,
      createdBy: session.user.id,
      width,
      height,
    });

    return NextResponse.json({ success: true, item: created });
  } catch (error) {
    console.error("[GalleryUpload] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}


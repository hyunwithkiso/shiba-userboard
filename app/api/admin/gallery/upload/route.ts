import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { userService } from "@/services/user-service";
import { UploadService } from "@/services/upload-service";
import { galleryService } from "@/services/gallery-service";

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

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string | null) ?? null;
    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    // 이미지 메타/비율 확인 (16:9, ±2%)
    const arrBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrBuf);
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) {
      return NextResponse.json({ error: "이미지 메타데이터를 확인할 수 없습니다." }, { status: 400 });
    }
    const ratio = meta.width / meta.height;
    const target = 16 / 9;
    const tolerance = 0.02;
    if (Math.abs(ratio - target) > tolerance) {
      return NextResponse.json({ error: "이미지는 16:9 비율이어야 합니다." }, { status: 400 });
    }

    const uploaded = await UploadService.uploadGalleryFile(file);
    if (!uploaded.success || !uploaded.url) {
      return NextResponse.json({ error: uploaded.error || "업로드 실패" }, { status: 400 });
    }

    const created = await galleryService.create({
      url: uploaded.url,
      title,
      createdBy: session.user.id,
      width: meta.width,
      height: meta.height,
    });

    return NextResponse.json({ success: true, item: created });
  } catch (error) {
    console.error("[AdminGalleryUpload] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}


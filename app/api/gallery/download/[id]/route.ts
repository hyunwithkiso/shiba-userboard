import { NextResponse } from "next/server";
import { galleryService } from "@/services/gallery-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await params.then((p) => p.id);
    const item = await galleryService.getById(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const res = await fetch(item.url, { cache: "no-store" });
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: "원본 이미지를 가져올 수 없습니다." }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";

    // 파일명 추출
    let fileName = "image";
    try {
      const u = new URL(item.url);
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last) fileName = last;
    } catch { }

    // 다운로드 카운트는 비동기 업데이트
    galleryService.incrementDownload(id).catch(() => { });

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    return new Response(buf, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
      status: 200,
    });
  } catch (error) {
    console.error("[GalleryDownload] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}


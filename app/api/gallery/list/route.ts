import { NextResponse } from "next/server";
import { galleryService } from "@/services/gallery-service";

export async function GET() {
  try {
    const items = await galleryService.list({ limit: 200 });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GalleryList] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}


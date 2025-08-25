import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { getCurrentUserId } from "@/lib/user-validation";

export const runtime = "nodejs"; // ensure Node.js runtime

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
    const qualityParam = formData.get("quality") as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "파일이 선택되지 않았습니다." }, { status: 400 });
    }

    // Parse quality parameter (default: 80, range: 10-100)
    const quality = qualityParam ? Math.max(10, Math.min(100, parseInt(qualityParam))) : 80;

    const arrayBuffer = await file.arrayBuffer();
    const input = Buffer.from(arrayBuffer);
    const originalSize = input.length;

    // Convert animated GIF -> animated WEBP with adjustable quality
    const webpBuffer = await sharp(input, { animated: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    const baseName = (file.name || "output").replace(/\.[^/.]+$/, "");
    const finalName = `${baseName}.webp`;
    const asciiFallback = finalName.replace(/[^\x20-\x7E]/g, "_");
    const encoded = encodeURIComponent(finalName);
    const optimizedSize = webpBuffer.length;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    // Use Uint8Array (ArrayBufferView) to satisfy DOM BodyInit typing
    const bodyView = new Uint8Array(
      webpBuffer.buffer as ArrayBuffer,
      webpBuffer.byteOffset,
      webpBuffer.byteLength
    );
    return new NextResponse(bodyView, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // ASCII fallback + RFC 5987 for UTF-8 filename to avoid ByteString errors on non-ASCII
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "no-store",
        "X-Original-Size": originalSize.toString(),
        "X-Optimized-Size": optimizedSize.toString(),
        "X-Compression-Ratio": compressionRatio,
      },
    });
  } catch (error: any) {
    console.error("gif-to-webp error:", error);
    return NextResponse.json(
      { error: error?.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

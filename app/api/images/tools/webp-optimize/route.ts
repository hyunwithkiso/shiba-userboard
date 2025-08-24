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
    const effortParam = formData.get("effort") as string | null;
    const losslessParam = formData.get("lossless") as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "파일이 선택되지 않았습니다." }, { status: 400 });
    }

    // Validate WEBP file
    const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
    if (!isWebp) {
      return NextResponse.json({ 
        error: "WEBP 파일만 지원됩니다." 
      }, { status: 400 });
    }

    // Parse parameters
    const quality = qualityParam ? Math.max(10, Math.min(100, parseInt(qualityParam))) : 80;
    const effort = effortParam ? Math.max(0, Math.min(6, parseInt(effortParam))) : 4;
    const lossless = losslessParam === 'true';

    const arrayBuffer = await file.arrayBuffer();
    const input = Buffer.from(arrayBuffer);

    // Get original file info for comparison
    const originalSize = input.length;
    
    // Optimize WEBP with advanced options
    let sharpInstance = sharp(input);
    
    // Check if animated
    const metadata = await sharpInstance.metadata();
    if (metadata.pages && metadata.pages > 1) {
      // Animated WEBP
      sharpInstance = sharp(input, { animated: true });
    }

    const webpOptions: any = {
      effort,
      ...(lossless ? { lossless: true } : { quality })
    };

    const optimizedBuffer = await sharpInstance
      .webp(webpOptions)
      .toBuffer();

    const compressionRatio = ((originalSize - optimizedBuffer.length) / originalSize * 100).toFixed(1);
    
    const baseName = (file.name || "output").replace(/\.[^/.]+$/, "");
    const suffix = lossless ? "lossless" : `q${quality}`;
    const finalName = `${baseName}_optimized_${suffix}.webp`;
    const asciiFallback = finalName.replace(/[^\x20-\x7E]/g, "_");
    const encoded = encodeURIComponent(finalName);
    
    return new NextResponse(optimizedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "no-store",
        "X-Original-Size": originalSize.toString(),
        "X-Optimized-Size": optimizedBuffer.length.toString(),
        "X-Compression-Ratio": compressionRatio,
      },
    });
  } catch (error: any) {
    console.error("webp-optimize error:", error);
    return NextResponse.json(
      { error: error?.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
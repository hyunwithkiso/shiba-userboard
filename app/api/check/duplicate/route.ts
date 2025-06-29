import { NextRequest, NextResponse } from "next/server";
import { checkImageNameDuplicate } from "@/services/game-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");
    const type = searchParams.get("type") as "killfeed" | "chattitle" | null;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name과 type 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    if (type !== "killfeed" && type !== "chattitle") {
      return NextResponse.json(
        { error: "type은 'killfeed' 또는 'chattitle'이어야 합니다." },
        { status: 400 }
      );
    }

    const isDuplicate = await checkImageNameDuplicate(name, type);

    return NextResponse.json({
      isDuplicate,
      available: !isDuplicate,
      message: isDuplicate 
        ? "이미 사용 중인 이름입니다." 
        : "사용 가능한 이름입니다."
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "중복 검사 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 
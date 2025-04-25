import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("files") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // 외부 API로 전달할 새로운 FormData 생성
    const externalFormData = new FormData();
    externalFormData.append("files", file);

    const uploadUrl = "https://screenshot.dokku.co.kr/files";
    if (!uploadUrl) {
      console.error("Image upload URL is not configured.");
      return NextResponse.json(
        { error: "이미지 업로드 환경설정이 되어있지 않습니다." },
        { status: 500 }
      );
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: externalFormData,
      // 외부 API가 특정 헤더를 요구하지 않는다면 추가 헤더 불필요
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("External API Error:", response.status, responseData);
      return NextResponse.json(
        { error: responseData.error || "이미지 업로드 실패" },
        { status: response.status }
      );
    }

    // 외부 API의 성공 응답을 그대로 클라이언트에 전달
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Proxy Upload Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "서버 내부 오류";
    return NextResponse.json(
      { error: `이미지 업로드 중 오류 발생: ${errorMessage}` },
      { status: 500 }
    );
  }
}

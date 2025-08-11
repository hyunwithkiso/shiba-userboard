import { auth } from "@/lib/auth";
import { db, killfeedSubmission, chatTitleSubmission } from "@/lib/schema";
import { userService } from "@/services/user-service";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const getUserInfo = await userService.getUserInfo(session.user.id);
    const isAdmin = getUserInfo.user?.isAdmin;
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { imageId, type } = body;

    if (!imageId || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 이미지 정보 가져오기
    let existingImage;
    if (type === "killfeed") {
      existingImage = await db
        .select()
        .from(killfeedSubmission)
        .where(eq(killfeedSubmission.id, imageId))
        .limit(1);
    } else if (type === "chat") {
      existingImage = await db
        .select()
        .from(chatTitleSubmission)
        .where(eq(chatTitleSubmission.id, imageId))
        .limit(1);
    } else {
      return new NextResponse("Invalid type", { status: 400 });
    }

    if (!existingImage?.length) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const image = existingImage[0];

    // 이미지 삭제 요청
    const deleteResponse = await fetch(
      `https://screenshot.dokku.co.kr/delete?type=${type}&path=${image.image}`,
      {
        method: "DELETE",
      }
    );

    if (!deleteResponse.ok) {
      throw new Error("Failed to delete image from storage");
    }

    // DB에서 이미지 정보 삭제
    if (type === "killfeed") {
      await db
        .delete(killfeedSubmission)
        .where(eq(killfeedSubmission.id, imageId));
    } else {
      await db
        .delete(chatTitleSubmission)
        .where(eq(chatTitleSubmission.id, imageId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}

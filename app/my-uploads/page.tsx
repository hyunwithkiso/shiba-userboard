import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUserData } from "@/lib/user-validation";
import { imageService } from "@/services/image-service";
import { getGameIdByDiscordId } from "@/services/game-service";
import MyUploadsClient from "./client";

export const metadata: Metadata = {
  title: "내 업로드 내역 | SHIBA 유저보드",
  description: "내가 업로드한 이미지 목록을 확인합니다.",
};

interface SubmissionItem {
  id: number;
  fileName: string;
  filePath: string;
  type: "killfeed" | "chat-title";
  fileSize?: number | null;
  uploadedAt: Date;
  status: "pending" | "approved" | "rejected" | "processing";
  reason?: string | null;
}

export default async function MyUploadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userData = await getCurrentUserData();
  if (!userData) {
    redirect("/login");
  }

  let gameUserId: number | null = userData.userId
    ? Number(userData.userId)
    : null;

  if (!gameUserId && userData.discordId) {
    try {
      const fetchedId = await getGameIdByDiscordId(userData.discordId);
      if (fetchedId !== null) {
        gameUserId = typeof fetchedId === "string" ? Number(fetchedId) : fetchedId;
      }
    } catch (err) {
      console.error("Failed to fetch game user id by discordId:", err);
    }
  }

  if (!gameUserId) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 text-center">
        <p className="text-red-500">게임 계정 연동 정보가 없습니다.</p>
      </div>
    );
  }

  let submissions: SubmissionItem[] = [];
  try {
    const images = await imageService.getUserImages(gameUserId);

    submissions = images.map((img: any) => ({
      id: img.id,
      fileName: img.name ?? img.fileName ?? img.image,
      filePath: `https://screenshot.dokku.co.kr/${
        img.type === "killfeed" ? "killfeed-api" : "chat-api"
      }/${img.image ?? img.fileName}`,
      type: img.type === "chattitle" ? "chat-title" : (img.type as "killfeed"),
      fileSize: img.metadata?.fileSize ?? null,
      uploadedAt: new Date(img.created_at ?? img.uploadedAt ?? Date.now()),
      status: img.status as "pending" | "approved" | "rejected" | "processing",
      reason: img.reason || null,
    }));

    submissions.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  } catch (error) {
    console.error("Failed to fetch user uploads:", error);
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 text-center">
        <p className="text-red-500">
          업로드 내역을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return <MyUploadsClient submissions={submissions} />;
}

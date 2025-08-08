import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminImagesClient from "./client";
import { imageService } from "@/services/image-service";

// 페이지네이션 상수
const ITEMS_PER_PAGE = 20;

export default async function AdminImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    type?: string; 
    status?: string; 
    page?: string;
    name?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  // searchParams 비동기로 받기
  const params = await searchParams;

  // 페이지네이션 및 필터 계산
  const currentPage = Number(params.page) || 1;
  const currentType = params.type || "all";
  const currentStatus = params.status || "all";
  const searchName = params.name || "";

  // 필터 설정
  const filters: any = {
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  };

  if (currentType !== "all") {
    filters.type = currentType as "killfeed" | "chattitle";
  }

  if (currentStatus !== "all") {
    filters.approved = currentStatus as "pending" | "approved" | "rejected";
  }

  if (searchName) {
    filters.name = searchName;
  }

  try {
    // MySQL에서 데이터 조회
    const submissions = await imageService.getAllImages(filters);
    
    // 전체 개수 조회 (페이지네이션용)
    const countFilters = { ...filters };
    delete countFilters.limit;
    delete countFilters.offset;
    const allSubmissions = await imageService.getAllImages(countFilters);
    const totalItems = allSubmissions.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // 데이터 형식 변환 (기존 client 컴포넌트와 호환)
    const formattedSubmissions = submissions.map((sub: any) => ({
      id: sub.id.toString(),
      userId: sub.user_id.toString(),
      userNickname: sub.user_nickname || "Unknown",
      type: (sub.type === "killfeed" ? "killfeed" : "chat") as "killfeed" | "chat",
      filePath: `https://screenshot.dokku.co.kr/${sub.type === "killfeed" ? "killfeed-api" : "chat-api"}/${sub.image}`,
      fileName: sub.image,
      fileSize: 0, // MySQL에 파일 크기 정보 없음
      uploadedAt: sub.created_at || new Date().toISOString(),
      status: sub.status, // 이미 문자열로 변환됨 (pending/approved/rejected)
      reviewedAt: sub.approved_at || null,
      reviewerId: null,
      reviewerNickname: null,
      reviewerUserId: null,
      adminNotes: sub.reason || null,
      reason: sub.reason || null,
      userGameId: sub.user_id.toString(),
      gameDbMetadata: sub.metadata,
      name: sub.name,
      code: sub.code,
    }));

    return (
      <div className="container max-w-6xl py-6 space-y-8 mx-auto">
        <AdminImagesClient
          submissions={formattedSubmissions}
          currentPage={currentPage}
          totalPages={totalPages}
          currentType={currentType}
          currentStatus={currentStatus}
          currentName={searchName}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading admin images:", error);
    // 에러 발생 시 빈 데이터로 표시
    return (
      <div className="container max-w-6xl py-6 space-y-8 mx-auto">
        <div className="text-center py-8">
          <p className="text-destructive">이미지 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }
}

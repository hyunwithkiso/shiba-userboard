import { auth } from "@/lib/auth";
import { chatTitleSubmission, db } from "@/lib/schema";
import { killfeedSubmission } from "@/lib/schema";
import { users } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminImagesClient from "./client";

// 페이지네이션 상수
const ITEMS_PER_PAGE = 20;

export default async function AdminImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; page?: string }>;
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

  // 조건문 (raw SQL)
  const typeCondition =
    currentType === "all"
      ? sql`1=1`
      : currentType === "killfeed"
      ? sql`type = 'killfeed'`
      : sql`type = 'chat'`;

  const statusCondition =
    currentStatus === "all" ? sql`1=1` : sql`status = ${currentStatus}`;

  const killfeedJoinQuery = sql`
    SELECT 
      k.id,
      k.user_id as "userId",
      k.file_path as "filePath",
      k.file_name as "fileName",
      k.file_type as "fileType",
      k.file_size as "fileSize",
      k.status,
      k.uploaded_at as "uploadedAt",
      k.reviewed_at as "reviewedAt",
      k.reviewer_id as "reviewerId",
      k.admin_notes as "adminNotes",
      NULL as "scale",
      'killfeed' as type,
      u.nickname as "userNickname",
      u.user_id as "userGameId",
      r.nickname as "reviewerNickname",
      r.user_id as "reviewerUserId"
    FROM ${killfeedSubmission} k
    LEFT JOIN ${users} u ON k.user_id = u.id
    LEFT JOIN ${users} r ON k.reviewer_id = r.id
  `;

  // chatTitle + users left join
  const chatTitleJoinQuery = sql`
    SELECT 
      c.id,
      c.user_id as "userId",
      c.file_path as "filePath",
      c.file_name as "fileName",
      c.file_type as "fileType",
      c.file_size as "fileSize",
      c.status,
      c.uploaded_at as "uploadedAt",
      c.reviewed_at as "reviewedAt",
      c.reviewer_id as "reviewerId",
      c.admin_notes as "adminNotes",
      c.scale,
      'chat' as type,
      u.nickname as "userNickname",
      u.user_id as "userGameId",
      r.nickname as "reviewerNickname",
      r.user_id as "reviewerUserId"
    FROM ${chatTitleSubmission} c
    LEFT JOIN ${users} u ON c.user_id = u.id
    LEFT JOIN ${users} r ON c.reviewer_id = r.id
  `;

  // 전체 쿼리 (UNION ALL + 정렬 + 페이징)
  const query = sql`
    WITH combined_submissions AS (
      ${killfeedJoinQuery}
      UNION ALL
      ${chatTitleJoinQuery}
    )
    SELECT *
    FROM combined_submissions
    WHERE ${typeCondition} AND ${statusCondition}
    ORDER BY "uploadedAt" DESC
    LIMIT ${ITEMS_PER_PAGE}
    OFFSET ${(currentPage - 1) * ITEMS_PER_PAGE}
  `;

  // 전체 아이템 수 쿼리
  const countQuery = sql`
    WITH combined_submissions AS (
      ${killfeedJoinQuery}
      UNION ALL
      ${chatTitleJoinQuery}
    )
    SELECT COUNT(*) as count
    FROM combined_submissions
    WHERE ${typeCondition} AND ${statusCondition}
  `;

  const [submissions, countResult] = await Promise.all([
    db.execute(query),
    db.execute(countQuery),
  ]);

  const totalItems = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  console.log(submissions);

  return (
    <div className="container max-w-6xl py-6 space-y-8 mx-auto">
      <AdminImagesClient
        submissions={submissions as any}
        currentPage={currentPage}
        totalPages={totalPages}
        currentType={currentType}
        currentStatus={currentStatus}
      />
    </div>
  );
}

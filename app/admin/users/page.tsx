import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkCurrentUserAdmin, getCurrentUserData } from "@/lib/user-validation";
import { db, users, accounts } from "@/lib/schema";
import { asc, eq, and, sql } from "drizzle-orm";
import AdminUsersClient from "./client";

export const metadata = {
  title: "유저 관리 | SHIBA 어드민",
  description: "유저 목록을 관리합니다.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isAdmin = await checkCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  // 현재 사용자 정보 가져오기 (마스터 권한 확인용)
  const currentUser = await getCurrentUserData();

  // 페이지네이션 설정
  const pageSize = 50;
  const params = await searchParams;
  const pageParam = params?.page ?? "1";
  const pageNumRaw = Number(pageParam);
  const page = Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : 1;

  // 전체 유저 수 계산 (users 테이블 기준)
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const totalCount = totalCountResult[0]?.count ?? 0;

  const userList = await db
    .selectDistinct({
      id: users.id,
      name: users.name,
      email: users.email,
      discordId: accounts.providerAccountId,
      userId: users.userId,
      // DISTINCT + ORDER BY 제약을 만족시키기 위해 정렬 키를 선택 목록에 포함
      userIdSortKey: sql<number>`CASE WHEN ${users.userId} ~ '^[0-9]+' THEN (${users.userId})::int ELSE NULL END`,
      nickname: users.nickname,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(
      accounts,
      and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
    )
    // DISTINCT 제약을 충족하기 위해 SELECT에 포함된 동일 표현식을 ORDER BY에서 직접 사용
    .orderBy(
      asc(sql`CASE WHEN ${users.userId} ~ '^[0-9]+' THEN (${users.userId})::int ELSE NULL END`),
      asc(users.userId)
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return (
    <div className="container max-w-8xl py-24 space-y-8 mx-auto">
      <AdminUsersClient
        userList={userList}
        isAdmin={isAdmin}
        currentUserUserId={currentUser?.userId}
        currentUserDiscordId={currentUser?.discordId}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkCurrentUserAdmin, getCurrentUserData } from "@/lib/user-validation";
import { users, accounts } from "@/lib/schema";
import { db } from "@/lib/db";
import { asc, desc, eq, and, sql } from "drizzle-orm";
import AdminUsersClient from "./client";

export const metadata = {
  title: "유저 관리 | SHIBA 어드민",
  description: "유저 목록을 관리합니다.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; filter?: string; q?: string; sort?: string; order?: string }>;
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

  // 페이지네이션/검색/정렬 설정
  const pageSize = 50;
  const params = await searchParams;
  const pageParam = params?.page ?? "1";
  const pageNumRaw = Number(pageParam);
  const page = Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : 1;

  const filter = (params?.filter ?? "").trim();
  const q = (params?.q ?? "").trim();
  const sort = (params?.sort ?? "userId").trim();
  const order = (params?.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  // where 조건 구성
  let whereExpr: ReturnType<typeof sql> | undefined = undefined;
  if (q && filter) {
    const qLike = `%${q}%`;
    if (filter === "userId") {
      whereExpr = sql`${users.userId} ILIKE ${qLike}`;
    } else if (filter === "email") {
      whereExpr = sql`${users.email} ILIKE ${qLike}`;
    } else if (filter === "nickname") {
      whereExpr = sql`${users.nickname} ILIKE ${qLike}`;
    } else if (filter === "discordId") {
      whereExpr = sql`${accounts.providerAccountId} ILIKE ${qLike}`;
    }
  }

  // 전체 유저 수 계산 (필터 반영, DISTINCT users.id 기준)
  let countQuery = db
    .select({ count: sql<number>`count(distinct ${users.id})` })
    .from(users)
    .leftJoin(
      accounts,
      and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
    );
  if (whereExpr) {
    // drizzle의 체이닝 특성상 조건이 있을 때만 where 추가
    countQuery = (countQuery as any).where(whereExpr);
  }
  const totalCountResult = await countQuery;
  const totalCount = totalCountResult[0]?.count ?? 0;

  // 정렬 기준 구성
  const numericUserIdKey = sql`CASE WHEN ${users.userId} ~ '^[0-9]+' THEN (${users.userId})::int ELSE NULL END`;
  let orderByExprs: any[] = [];
  if (sort === "discordId") {
    orderByExprs = [order === "desc" ? desc(accounts.providerAccountId) : asc(accounts.providerAccountId)];
  } else if (sort === "nickname") {
    orderByExprs = [order === "desc" ? desc(users.nickname) : asc(users.nickname)];
  } else if (sort === "email") {
    orderByExprs = [order === "desc" ? desc(users.email) : asc(users.email)];
  } else {
    // userId 기본 정렬: 숫자 우선 정렬 + 보조 문자열 정렬, asc/desc 지원
    orderByExprs = [
      order === "desc" ? desc(numericUserIdKey) : asc(numericUserIdKey),
      order === "desc" ? desc(users.userId) : asc(users.userId),
    ];
  }

  // 목록 조회 (필터/정렬 반영)
  let listQuery = db
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
    );
  if (whereExpr) {
    listQuery = (listQuery as any).where(whereExpr);
  }
  const userList = await (listQuery as any)
    .orderBy(...orderByExprs)
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
        initialFilter={filter || ""}
        initialSearch={q || ""}
        initialSort={sort || "userId"}
        initialOrder={order || "asc"}
      />
    </div>
  );
}

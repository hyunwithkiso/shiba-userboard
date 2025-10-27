import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkCurrentUserAdmin, getCurrentUserData } from "@/lib/user-validation";
import { db, users, accounts } from "@/lib/schema";
import { desc, asc, eq, and } from "drizzle-orm";
import AdminUsersClient from "./client";

export const metadata = {
  title: "유저 관리 | SHIBA 어드민",
  description: "유저 목록을 관리합니다.",
};

export default async function AdminUsersPage() {
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

  const userList = await db
    .selectDistinct({
      id: users.id,
      name: users.name,
      email: users.email,
      discordId: accounts.providerAccountId,
      userId: users.userId,
      nickname: users.nickname,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(
      accounts,
      and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
    )
    .orderBy(desc(users.createdAt));

  return (
    <div className="container max-w-8xl py-24 space-y-8 mx-auto">
      <AdminUsersClient userList={userList} currentUserUserId={currentUser?.userId} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, users } from "@/lib/schema";
import { desc, asc } from "drizzle-orm";
import AdminUsersClient from "./client";

export const metadata = {
  title: "유저 관리 | SHIBA 어드민",
  description: "유저 목록을 관리합니다.",
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      discordId: users.discordId,
      userId: users.userId,
      nickname: users.nickname,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.userId));

  return (
    <div className="container max-w-6xl py-6 space-y-8 mx-auto">
      <AdminUsersClient userList={userList} />
    </div>
  );
}

"use server";

import { auth } from "@/lib/auth";
import { users, accounts } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { checkGuildMembershipAndFetchProfile } from "./discord-action";
import { revalidatePath } from "next/cache";

/**
 * 사용자의 Discord 프로필(닉네임, 역할)을 동기화합니다.
 * 마지막 동기화로부터 일정 시간이 지나지 않았으면 스킵합니다.
 */
export async function syncUserProfileWithDiscord() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Not authenticated" };

        const userId = session.user.id;

        // 1. 사용자 정보 및 마지막 동기화 시간 조회
        const [user] = await db
            .select({
                discordId: accounts.providerAccountId,
                lastSyncedAt: users.lastSyncedAt,
                nickname: users.nickname,
                roles: users.roles,
            })
            .from(users)
            .leftJoin(
                accounts,
                and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
            )
            .where(eq(users.id, userId))
            .limit(1);

        if (!user || !user.discordId) {
            // 조용히 리턴 (에러 아님)
            return { success: false, error: "User or Discord ID not found" };
        }

        // 2. 동기화 주기 확인 (예: 1시간 = 3600000ms)
        const SYNC_INTERVAL = 60 * 60 * 1000;
        const now = new Date();
        if (
            user.lastSyncedAt &&
            now.getTime() - user.lastSyncedAt.getTime() < SYNC_INTERVAL
        ) {
            // console.log(`[Sync] Skipping sync for user ${userId} (Recently synced)`);
            return { success: true, skipped: true };
        }

        console.log(`[Sync] Syncing profile for user ${userId}...`);

        // 3. Discord API 호출
        const result = await checkGuildMembershipAndFetchProfile(user.discordId);

        if (!result.success || !result.profile) {
            console.error(`[Sync] Failed to fetch Discord profile: ${result.error}`);
            // 에러가 발생해도 사용자에게는 성공처럼 보이게 하여 접속 차단 방지
            return { success: true, error: result.error };
        }

        // 4. 데이터 비교 및 DB 업데이트
        const newRoleNames = result.profile.roles.map((r) => r.name);
        const currentRoleNames = user.roles || [];

        console.log(`[Sync] Fetched Discord Profile: ${result.profile.nickname}, Roles: ${newRoleNames.join(", ")}`);
        console.log(`[Sync] Current DB Profile: ${user.nickname}, Roles: ${currentRoleNames.join(", ")}`);

        // 닉네임과 역할이 같은지 비교
        const isNicknameSame = user.nickname === result.profile.nickname;
        const isRolesSame =
            newRoleNames.length === currentRoleNames.length &&
            newRoleNames.every((val) => currentRoleNames.includes(val));

        if (isNicknameSame && isRolesSame) {
            console.log(`[Sync] Profile is up to date for user ${userId}. Updating timestamp only.`);
            // 데이터가 같으면 lastSyncedAt만 업데이트 (API 호출 주기 초기화)
            await db
                .update(users)
                .set({
                    lastSyncedAt: now,
                })
                .where(eq(users.id, userId));

            return { success: true, updated: false, skipped: true };
        }

        // 데이터가 다르면 전체 업데이트
        await db
            .update(users)
            .set({
                nickname: result.profile.nickname,
                roles: newRoleNames,
                lastSyncedAt: now,
                updatedAt: now,
            })
            .where(eq(users.id, userId));

        console.log(`[Sync] Successfully synced profile for user ${userId}`);

        // 5. 캐시 갱신
        revalidatePath("/profile");

        return { success: true, updated: true };
    } catch (error) {
        console.error("[Sync] Error syncing user profile:", error);
        // 에러 발생 시에도 조용히 넘어가도록 처리
        return { success: true, error: "Internal Server Error (Handled)" };
    }
}

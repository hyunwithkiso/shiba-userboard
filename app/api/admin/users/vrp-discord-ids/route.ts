import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentUserData } from "@/lib/user-validation";
import pool from "@/lib/mysql";
import { users, accounts } from "@/lib/schema";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";

/**
 * 관리자(슈퍼 마스터)용: VRP MySQL의 vrp_user_ids에서
 * identifier LIKE 'discord:%' 전체 목록을 조회하여 반환합니다.
 *
 * GET /api/admin/users/vrp-discord-ids
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "인증 필요" }, { status: 401 });
    }

    // 슈퍼 마스터 가드: userId 또는 discordId가 "1" 또는 "2"인 경우만 허용
    const me = await getCurrentUserData();
    const isSuperMaster = (
      me?.userId === "1" || me?.userId === "2" || me?.discordId === "1" || me?.discordId === "2"
    );
    if (!isSuperMaster) {
      return NextResponse.json({ success: false, error: "슈퍼 마스터만 접근 가능합니다" }, { status: 403 });
    }

    // 쿼리 파라미터: onlyMatches 기본값 true
    const url = new URL(req.url);
    const onlyMatchesParam = url.searchParams.get("onlyMatches");
    const onlyMatches = onlyMatchesParam === null ? true : ["1", "true", "yes"].includes(onlyMatchesParam);

    // 사이트 디스코드 계정 목록 조회 (provider='discord')
    const siteDiscordRows = await db
      .select({
        siteUid: users.id,
        siteUserId: users.userId,
        discordId: accounts.providerAccountId,
        email: users.email,
        name: users.name,
        nickname: users.nickname,
      })
      .from(users)
      .leftJoin(
        accounts,
        and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
      );
    const siteDiscordSet = new Set(
      siteDiscordRows.map((r) => r.discordId).filter((v): v is string => !!v)
    );
    const siteDiscordMap = new Map<string, typeof siteDiscordRows[number]>(
      siteDiscordRows
        .filter((r) => !!r.discordId)
        .map((r) => [r.discordId as string, r])
    );

    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.execute(
        "SELECT `identifier`, `user_id`, `banned` FROM `vrp_user_ids` WHERE `identifier` LIKE 'discord:%' ORDER BY `user_id` ASC"
      );

      const allMappings = (rows as any[]).map((r) => {
        const identifier: string = r.identifier ?? "";
        const discordId = identifier.startsWith("discord:") ? identifier.slice(8) : identifier;
        const userId = Number(r.user_id);
        const site = discordId ? siteDiscordMap.get(discordId) : undefined;
        return {
          identifier,
          discordId,
          userId,
          banned: r.banned ?? null,
          match: siteDiscordSet.has(discordId),
          site: site
            ? {
                siteUid: site.siteUid,
                siteUserId: site.siteUserId,
                email: site.email,
                name: site.name,
                nickname: site.nickname,
              }
            : null,
        };
      });

      const mappings = onlyMatches ? allMappings.filter((m) => m.match) : allMappings;

      return NextResponse.json({ success: true, count: mappings.length, onlyMatches, mappings });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("[AdminVRPDiscordIds] Error:", error);
    return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
  }
}
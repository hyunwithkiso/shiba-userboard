import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkCurrentUserAdmin } from "@/lib/user-validation";
import { db, users } from "@/lib/schema";
import { sql, asc } from "drizzle-orm";
import pool from "@/lib/mysql";

/**
 * 관리자용: 사이트 DB(Postgres)와 VRP DB(MySQL)의 user_id 목록을 반환하고
 * 상호 누락된 ID를 계산합니다.
 * GET /api/admin/users/user-ids
 * Response: {
 *   siteUserIds: string[],
 *   vrpUserIds: number[],
 *   counts: { site: number, vrp: number },
 *   missingInSite: string[],      // VRP에는 있는데 사이트에는 없는 ID (문자열로 반환)
 *   missingInVrp: string[]        // 사이트에는 있는데 VRP에는 없는 ID (문자열로 반환)
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "인증 필요" }, { status: 401 });
    }

    const isAdmin = await checkCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "관리자 권한 필요" }, { status: 403 });
    }

    // 사이트 DB의 user_id 목록 (NULL 제외, 숫자 우선 오름차순)
    const siteRows = await db
      .select({ userId: users.userId })
      .from(users)
      .where(sql`${users.userId} IS NOT NULL`)
      .orderBy(
        // 숫자로 변환 가능한 경우 정렬 키로 사용, 그 외는 문자열 정렬로 후순위
        sql`CASE WHEN ${users.userId} ~ '^[0-9]+' THEN (${users.userId})::int END NULLS LAST`,
        asc(users.userId)
      );

    const siteUserIds: string[] = siteRows
      .map((r) => (r.userId ?? "").toString())
      .filter((v) => v.length > 0);

    // VRP DB의 사용자 ID 목록 (vrp_users.id 기준)
    let connection;
    let vrpUserIds: number[] = [];
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.execute("SELECT `id` FROM `vrp_users` ORDER BY `id` ASC");
      vrpUserIds = (rows as any[]).map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
    } finally {
      if (connection) connection.release();
    }

    // 비교를 위해 문자열로 표준화
    const siteSet = new Set(siteUserIds.map((s) => s.trim()));
    const vrpStrings = vrpUserIds.map((n) => String(n));
    const vrpSet = new Set(vrpStrings);

    const missingInSite = vrpStrings.filter((id) => !siteSet.has(id));
    const missingInVrp = siteUserIds.filter((id) => !vrpSet.has(id));

    return NextResponse.json({
      success: true,
      siteUserIds,
      vrpUserIds,
      counts: { site: siteUserIds.length, vrp: vrpUserIds.length },
      missingInSite,
      missingInVrp,
    });
  } catch (error) {
    console.error("[AdminUserIds] Error:", error);
    return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
  }
}
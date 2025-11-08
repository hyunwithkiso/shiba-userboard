import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import mysqlPool from "@/lib/mysql"; // VRP MySQL (default export)
import type { RowDataPacket } from "mysql2/promise"; // MySQL row typing
import { checkCurrentUserAdmin } from "@/lib/user-validation"; // admin check
import {
  db as pg,
  users,
  accounts,
} from "@/lib/schema"; // Site Postgres

type Body = {
  apply?: boolean;
  limit?: number;
  offset?: number;
};

// MySQL Row typing compatible with mysql2/promise generics
interface VRPRow extends RowDataPacket {
  identifier: string;
  user_id: number;
  banned: number | null;
}

export async function POST(req: Request) {
  try {
    const isAdmin = await checkCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { apply = false, limit, offset = 0 } = (await req.json()) as Body;

    // Fetch site discord accounts and associated users
    const siteDiscordAccounts = await pg
      .select({
        siteUid: users.id,
        siteUserId: users.userId,
        email: users.email,
        name: users.name,
        nickname: users.nickname,
        discordId: accounts.providerAccountId,
      })
      .from(users)
      .innerJoin(accounts, eq(users.id, accounts.userId))
      .where(eq(accounts.provider, "discord"));

    // Map of discordId -> site user record
    const siteByDiscord = new Map<string, (typeof siteDiscordAccounts)[number]>();
    for (const row of siteDiscordAccounts) {
      if (row.discordId) siteByDiscord.set(String(row.discordId), row);
    }

    // Build existing owners of user_id to avoid duplicate target assignment
    const existingUserIds = new Map<string, string>(); // userId -> siteUid
    for (const row of siteDiscordAccounts) {
      if (row.siteUserId) existingUserIds.set(String(row.siteUserId), String(row.siteUid));
    }

    // Fetch VRP discord mappings from MySQL (rows typed via RowDataPacket)
    const [vrpRows] = await mysqlPool.query<VRPRow[]>(
      "SELECT identifier, user_id, banned FROM vrp_user_ids WHERE identifier LIKE 'discord:%'"
    );

    type Candidate = {
      siteUid: string;
      currentUserId: string | null;
      newUserId: string;
      discordId: string;
      email: string | null;
      name: string | null;
      nickname: string | null;
    };

    const candidates: Candidate[] = [];
    for (const r of vrpRows) {
      const m = r.identifier.match(/^discord:(\d{5,})$/);
      if (!m) continue;
      const discordId = m[1];
      const site = siteByDiscord.get(discordId);
      if (!site) continue;
      const newUserId = String(r.user_id);
      candidates.push({
        siteUid: String(site.siteUid),
        currentUserId: site.siteUserId ? String(site.siteUserId) : null,
        newUserId,
        discordId,
        email: site.email ?? null,
        name: site.name ?? null,
        nickname: site.nickname ?? null,
      });
    }

    // Filter to those that actually need update and will not cause duplicate conflicts
    const toUpdate: Candidate[] = [];
    for (const c of candidates) {
      if (c.currentUserId === c.newUserId) continue; // already set
      const owner = existingUserIds.get(c.newUserId);
      if (owner && owner !== c.siteUid) {
        // Target user_id already owned by a different site user; skip to avoid duplication
        continue;
      }
      toUpdate.push(c);
    }

    const total = toUpdate.length;
    const sliced = typeof limit === "number" ? toUpdate.slice(offset, offset + limit) : toUpdate.slice(offset);

    if (!apply) {
      return NextResponse.json({
        apply: false,
        counts: {
          candidates: candidates.length,
          willUpdate: total,
          batchSize: sliced.length,
          skippedDueToDuplicate: candidates.length - total,
        },
        changes: sliced,
      });
    }

    // Apply updates in a transaction in batches
    const updated: Candidate[] = [];
    await pg.transaction(async (tx) => {
      for (const c of sliced) {
        await tx.update(users).set({ userId: c.newUserId }).where(eq(users.id, c.siteUid));
        updated.push(c);
        existingUserIds.set(c.newUserId, c.siteUid);
      }
    });

    return NextResponse.json({
      apply: true,
      counts: {
        updated: updated.length,
        remaining: total - updated.length,
      },
      updated,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
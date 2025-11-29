import { auth } from "@/lib/auth";
import { userLogs, apiKeys } from "@/lib/schema";
import { db } from "@/lib/db";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKeyHeader = request.headers.get("x-api-key");
        if (!apiKeyHeader) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
        }

        // Validate API Key
        const apiKeyRecord = await db.query.apiKeys.findFirst({
            where: and(eq(apiKeys.key, apiKeyHeader), eq(apiKeys.isActive, true)),
        });

        if (!apiKeyRecord) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
        }

        // Ensure the key belongs to the user requesting the logs
        if (apiKeyRecord.userId !== session.user.id) {
            return NextResponse.json({ error: "Invalid API Key for this user" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const userId = searchParams.get("userId");
        const type = searchParams.get("type");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        let targetUserId = session.user.id;

        // If querying for another user, check if requester is admin
        if (userId && userId !== session.user.id) {
            // TODO: Add admin check logic here if needed. 
            // For now, restrict to own logs to be safe.
            return NextResponse.json({ error: "Forbidden: Can only view own logs" }, { status: 403 });
        }

        const whereConditions = [eq(userLogs.userId, targetUserId)];

        // Filter by Type
        if (type) {
            const allowedTypes = ["ITEM_TRADE", "MONEY_TRADE", "BANK_TRADE", "VEHICLE_TRADE"];
            if (!allowedTypes.includes(type)) {
                return NextResponse.json({ error: `Invalid type. Allowed types: ${allowedTypes.join(", ")}` }, { status: 400 });
            }
            whereConditions.push(eq(userLogs.action, type));
        }

        // Filter by Date Range
        if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                return NextResponse.json({ error: "Invalid startDate format" }, { status: 400 });
            }
            whereConditions.push(gte(userLogs.createdAt, start));
        }

        if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
            }
            // Adjust end date to include the full day if it's just a date string, or use as is
            // If user passes "2023-01-01", they usually mean until the end of that day.
            // But if they pass ISO string, respect it.
            // For simplicity, let's assume exact timestamp or handle client side, but here we just check LTE.
            whereConditions.push(lte(userLogs.createdAt, end));
        }

        const logs = await db
            .select()
            .from(userLogs)
            .where(and(...whereConditions))
            .orderBy(desc(userLogs.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            logs,
            meta: {
                limit,
                offset,
                count: logs.length // Note: This is page count, not total count. Total count would require another query.
            }
        });
    } catch (error) {
        console.error("Error fetching logs:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

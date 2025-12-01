import { auth } from "@/lib/auth";
import { apiKeys } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { NewLogService } from "@/services/new-log-service";

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
        const message = searchParams.get("message");

        // If querying for another user, check if requester is admin
        if (userId && userId !== session.user.id) {
            // TODO: Add admin check logic here if needed. 
            // For now, restrict to own logs to be safe.
            return NextResponse.json({ error: "Forbidden: Can only view own logs" }, { status: 403 });
        }

        // Calculate page from offset
        const page = Math.floor(offset / limit) + 1;

        // Helper to format date to YYYY-MM-DD (KST aware)
        const formatDate = (dateStr: string | null) => {
            if (!dateStr) return undefined;
            // If it's already YYYY-MM-DD, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

            // If it's ISO, convert to KST and extract YYYY-MM-DD
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return undefined;
                // Add 9 hours for KST
                const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
                return kstDate.toISOString().split('T')[0];
            } catch (e) {
                return undefined;
            }
        };

        const logsData = await NewLogService.getPartitionLogs({
            page,
            limit,
            type: (type && type !== "ALL" && type !== "all") ? type : undefined,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            message: message || undefined,
            // userId: session.user.id, // Removed as per user request
        });

        return NextResponse.json({
            ...logsData,
            appliedFilters: {
                page,
                limit,
                type: (type && type !== "ALL" && type !== "all") ? type : undefined,
                startDate: formatDate(startDate) || undefined,
                endDate: formatDate(endDate) || undefined,
                message: message || undefined,
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

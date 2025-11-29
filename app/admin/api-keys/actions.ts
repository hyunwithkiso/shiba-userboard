"use server";

import { checkAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ApiKeyData = {
    id: string;
    key: string;
    isActive: boolean;
    createdAt: Date;
    user: {
        id: string;
        nickname: string | null;
        email: string | null;
        image: string | null;
    } | null;
};

export async function getAllApiKeys(): Promise<{ success: boolean; data?: ApiKeyData[]; error?: string }> {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        const keys = await db.query.apiKeys.findMany({
            with: {
                user: {
                    columns: {
                        id: true,
                        nickname: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: [desc(apiKeys.createdAt)],
        });

        return { success: true, data: keys };
    } catch (error) {
        console.error("Error fetching API keys:", error);
        return { success: false, error: "Failed to fetch API keys" };
    }
}

export async function revokeApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        await db
            .update(apiKeys)
            .set({ isActive: false })
            .where(eq(apiKeys.id, keyId));

        revalidatePath("/admin/api-keys");
        return { success: true };
    } catch (error) {
        console.error("Error revoking API key:", error);
        return { success: false, error: "Failed to revoke API key" };
    }
}

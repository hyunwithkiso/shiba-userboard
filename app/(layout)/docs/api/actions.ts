"use server";

import { auth } from "@/lib/auth";
import { apiKeys } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function generateApiKey() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const newKey = `sk_${nanoid(32)}`;

    // Check if user already has a key
    const existingKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.userId, userId),
    });

    if (existingKey) {
        // Update existing key
        await db
            .update(apiKeys)
            .set({ key: newKey, isActive: true, createdAt: new Date() })
            .where(eq(apiKeys.id, existingKey.id));
    } else {
        // Create new key
        await db.insert(apiKeys).values({
            userId,
            key: newKey,
        });
    }

    revalidatePath("/docs/api");
    return { key: newKey };
}

export async function getApiKey() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const keyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.userId, session.user.id),
    });

    return keyRecord ? { key: keyRecord.key } : null;
}

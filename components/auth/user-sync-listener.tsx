"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { syncUserProfileWithDiscord } from "@/actions/sync-action";

export function UserSyncListener() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session?.user?.id) {
            // 비동기 실행 (결과를 기다리지 않음)
            syncUserProfileWithDiscord()
                .then((result) => {
                    if (result.success) {
                        if (result.error) {
                            console.warn("[UserSyncListener] Sync completed with error:", result.error);
                        } else if (result.updated) {
                            console.log("[UserSyncListener] Profile synced successfully");
                        } else if (result.skipped) {
                            // console.log("[UserSyncListener] Sync skipped (recently synced)");
                        }
                    } else {
                        console.error("[UserSyncListener] Sync failed:", result.error);
                    }
                })
                .catch((err) => {
                    console.error("[UserSyncListener] Error triggering sync:", err);
                });
        }
    }, [status, session?.user?.id]);

    return null; // UI를 렌더링하지 않음
}

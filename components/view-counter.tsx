"use client";

import { useEffect } from "react";
import { incrementNoticeViewCount } from "@/actions/notice-actions";
import { incrementEventViewCount } from "@/actions/event-actions";

interface ViewCounterProps {
  type: "notice" | "event";
  itemId: string;
}

const VIEW_INTERVAL = 5 * 60 * 1000; // 5분

export function ViewCounter({ type, itemId }: ViewCounterProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storageKey = `lastViewed_${type}_${itemId}`;
      const lastViewed = localStorage.getItem(storageKey);
      const now = new Date().getTime();

      if (!lastViewed || now - parseInt(lastViewed) > VIEW_INTERVAL) {
        if (type === "notice") {
          incrementNoticeViewCount(itemId)
            .then(() => localStorage.setItem(storageKey, now.toString()))
            .catch(console.error);
        } else if (type === "event") {
          incrementEventViewCount(itemId)
            .then(() => localStorage.setItem(storageKey, now.toString()))
            .catch(console.error);
        }
      }
    }
  }, [type, itemId]);

  return null; // UI는 따로 없음
}

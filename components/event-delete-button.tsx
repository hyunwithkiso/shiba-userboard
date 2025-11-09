"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { deleteEventAction } from "@/actions/event-actions";

interface EventDeleteButtonProps {
  eventId: string;
  variant?: "icon" | "text";
}

export function EventDeleteButton({ eventId, variant = "text" }: EventDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!eventId) return;
    const ok = window.confirm("해당 이벤트를 삭제하시겠습니까? 삭제 후 되돌릴 수 없습니다.");
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteEventAction(eventId);
      if (res?.success) {
        router.push("/events");
        router.refresh();
      } else {
        alert(res?.error || "삭제 중 오류가 발생했습니다.");
      }
    });
  };

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="이벤트 삭제"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash className="mr-1 h-4 w-4" /> 삭제
    </Button>
  );
}
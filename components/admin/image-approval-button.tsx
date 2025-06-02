"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ImageApprovalButtonProps {
  imageId: string;
  type: "killfeed" | "chat";
  onSuccess?: () => void;
}

export function ImageApprovalButton({
  imageId,
  type,
  onSuccess,
}: ImageApprovalButtonProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          type,
          status: "approved",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "승인 처리 중 오류가 발생했습니다.");
      }

      toast.success("이미지가 성공적으로 승인되었습니다.");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(
        error instanceof Error ? error.message : "오류가 발생했습니다."
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          type,
          status: "rejected",
          adminNotes: rejectReason.trim() || "관리자에 의해 거부됨",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "거부 처리 중 오류가 발생했습니다.");
      }

      toast.success("이미지가 성공적으로 거부되었습니다.");

      setShowRejectDialog(false);
      setRejectReason("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(
        error instanceof Error ? error.message : "오류가 발생했습니다."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const isProcessing = isApproving || isRejecting;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4 mr-2" />
            )}
            상태 변경
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleApprove}
            disabled={isProcessing}
            className="text-green-600 font-medium"
          >
            <Check className="h-4 w-4 mr-2" />
            승인
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowRejectDialog(true)}
            disabled={isProcessing}
            className="text-orange-600 font-medium"
          >
            <X className="h-4 w-4 mr-2" />
            거부
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지 거부</DialogTitle>
            <DialogDescription>
              이미지를 거부하는 이유를 입력해주세요. 이 내용은 관리자 메모로
              저장됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="거부 이유를 입력하세요"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              거부 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

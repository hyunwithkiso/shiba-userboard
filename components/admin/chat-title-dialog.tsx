"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import ChatTitleExample from "@/components/chat/chat-title-example";

interface ChatTitleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageId: string;
  onSuccess?: () => void;
}

export default function ChatTitleDialog({
  open,
  onOpenChange,
  imageUrl,
  imageId,
  onSuccess,
}: ChatTitleDialogProps) {
  const [scale, setScale] = useState(0.7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleScaleChange = (value: number[]) => {
    setScale(value[0] / 100);
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);

      console.log("Approving chat title with scale:", scale);

      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          type: "chat",
          status: "approved",
          scale: scale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "승인 처리 중 오류가 발생했습니다.");
      }

      toast({
        title: "승인 완료",
        description: "채팅 칭호가 성공적으로 승인되었습니다.",
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        variant: "destructive",
        title: "승인 실패",
        description:
          error instanceof Error ? error.message : "오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          type: "chat",
          status: "rejected",
          adminNotes: "관리자에 의해 거부됨",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "거부 처리 중 오류가 발생했습니다.");
      }

      toast({
        title: "거부 완료",
        description: "채팅 칭호가 성공적으로 거부되었습니다.",
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        variant: "destructive",
        title: "거부 실패",
        description:
          error instanceof Error ? error.message : "오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>채팅 칭호 이미지 미리보기</DialogTitle>
          <DialogDescription>
            채팅 칭호 이미지의 크기를 조절하고 승인 여부를 결정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="border rounded-lg p-4 bg-muted/20">
            <ChatTitleExample imageSrc={imageUrl} scale={scale} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>크기 조절</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <Slider
                value={[scale * 100]}
                onValueChange={handleScaleChange}
                min={50}
                max={90}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                * 채팅 칭호 이미지의 크기를 조절하세요. 채팅창에 잘 어울리는
                크기로 조절하는 것이 좋습니다.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            거부
          </Button>
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            승인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

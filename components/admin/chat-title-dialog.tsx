"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";

// gameDbMetadata 타입 (schema.ts와 일치)
interface Metadata {
  width?: string;
  scale?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

interface ChatTitleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageId: string;
  initialMetadata: Metadata; // 초기 메타데이터 prop 추가
  initialAdminNotes?: string | null;
  onSuccess: () => void; // 성공 콜백
}

export default function ChatTitleDialog({
  open,
  onOpenChange,
  imageUrl,
  imageId,
  initialMetadata,
  initialAdminNotes,
  onSuccess,
}: ChatTitleDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Editor State - 개선된 기본값들
  const width = "100px"; // 고정값
  const [scale, setScale] = useState((initialMetadata?.scale || 0.7) * 100); // 0-1 -> 0-100%
  const [marginTop, setMarginTop] = useState(initialMetadata?.marginTop || -5);
  const [marginSide, setMarginSide] = useState(initialMetadata?.marginRight || -10); // 좌우 공통
  const marginBottom = 0; // 고정값
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes || "");

  // Reset state when dialog opens or initialMetadata changes
  useEffect(() => {
    if (open) {
      setScale((initialMetadata?.scale || 0.7) * 100);
      setMarginTop(initialMetadata?.marginTop || -5);
      setMarginSide(initialMetadata?.marginRight || -10);
      setAdminNotes(initialAdminNotes || "");
    }
  }, [open, initialMetadata, initialAdminNotes]);

  // 현재 에디터 상태로 metadata 객체 생성 (개선된 형식)
  const getCurrentMetadata = () => ({
    width,
    scale: scale / 100, // 0-100% -> 0-1
    margin: `${marginTop}px ${marginSide}px ${marginBottom}px`,
  });

  // 마진 문자열 생성 (표시용)
  const getMarginString = () => `${marginTop}px ${marginSide}px ${marginBottom}px`;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          type: "chat", // 타입 명시
          status: "approved",
          adminNotes: adminNotes,
          // 개선된 메타데이터 형식
          metadata: {
            width,
            scale: scale / 100,
            marginTop,
            marginRight: marginSide,
            marginBottom,
            marginLeft: marginSide,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "승인 처리 중 오류 발생");
      }

      toast.success("채팅 칭호가 승인되었습니다.");
      onSuccess(); // 부모 컴포넌트에 성공 알림 (데이터 새로고침 등)
      onOpenChange(false); // 다이얼로그 닫기
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          type: "chat",
          status: "rejected",
          adminNotes: adminNotes,
          // 거절 시에도 현재 설정 전달 (필요시)
          margin: getMarginString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "거절 처리 중 오류 발생");
      }

      toast.success("채팅 칭호가 거절되었습니다.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>채팅 칭호 검토 및 수정</DialogTitle>
          <DialogDescription>
            채팅 칭호 미리보기를 확인하고 스타일을 조정한 후 승인 또는 거절할 수
            있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          {/* Preview Area */}
          <div className="space-y-4">
            <Label>채팅창 미리보기</Label>
            <div className="border rounded-lg p-4 bg-background min-h-[80px] flex items-center justify-center">
              <ChatTitleExample
                imageSrc={imageUrl}
                metadata={getCurrentMetadata()}
              />
            </div>
          </div>

          {/* Editor Area */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-medium">스타일 조정</h3>

              {/* Scale */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="scale">크기 (Scale)</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(scale)}%</span>
                </div>
                <Slider
                  id="scale"
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={50} // 최소 50%
                  max={150} // 최대 150%
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  채팅창에서의 크기를 조정합니다 (50% ~ 150%)
                </p>
              </div>

              {/* Margins - 개선된 형식 */}
              <div className="space-y-3">
                <Label>여백 조정 (px)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="marginTop" className="text-xs">상단 여백</Label>
                    <Input
  id="marginTop"
  type="text"
  inputMode="numeric"
  pattern="-?\\d*"
  value={marginTop}
  onChange={e => {
    let val = e.target.value.replace(/[^-\d]/g, "");
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num < -10) num = -10;
    if (num > 10) num = 10;
    setMarginTop(num);
  }}
  maxLength={3}
/>

                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="marginSide" className="text-xs">좌우 여백</Label>
                    <Input
  id="marginSide"
  type="text"
  inputMode="numeric"
  pattern="-?\\d*"
  value={marginSide}
  onChange={e => {
    let val = e.target.value.replace(/[^-\d]/g, "");
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num < -10) num = -10;
    if (num > 10) num = 10;
    setMarginSide(num);
  }}
  maxLength={3}
/>

                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  마진 형식: <code className="bg-muted px-1 rounded">{getMarginString()}</code> (하단은 0으로 고정)
                </p>
              </div>


              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">관리자 메모</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="검토 의견이나 참고사항을 입력하세요."
                  className="h-24"
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  * 스타일을 조정하여 채팅창에서의 모습을 확인해보세요.
                </p>
                <p className="text-xs text-muted-foreground">
                  * 승인 시 설정된 값들이 게임에 적용됩니다.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            취소
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                "거절"
              )}
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                "승인 및 저장"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

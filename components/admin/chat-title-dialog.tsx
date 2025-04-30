"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "../ui/scroll-area";

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
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Editor State
  const [width, setWidth] = useState(initialMetadata?.width || "100px");
  const [scale, setScale] = useState((initialMetadata?.scale || 0.7) * 100); // 0-1 -> 0-100%
  const [marginTop, setMarginTop] = useState(initialMetadata?.marginTop || -3);
  const [marginRight, setMarginRight] = useState(
    initialMetadata?.marginRight || -10
  );
  const [marginBottom, setMarginBottom] = useState(
    initialMetadata?.marginBottom || 0
  );
  const [marginLeft, setMarginLeft] = useState(
    initialMetadata?.marginLeft || -10
  );
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes || "");

  // Reset state when initialMetadata changes (e.g., opening dialog for different image)
  useEffect(() => {
    setWidth(initialMetadata?.width || "100px");
    setScale((initialMetadata?.scale || 0.7) * 100);
    setMarginTop(initialMetadata?.marginTop || -3);
    setMarginRight(initialMetadata?.marginRight || -10);
    setMarginBottom(initialMetadata?.marginBottom || 0);
    setMarginLeft(initialMetadata?.marginLeft || -10);
    setAdminNotes(initialAdminNotes || "");
  }, [initialMetadata, initialAdminNotes]);

  // 현재 에디터 상태로 metadata 객체 생성
  const getCurrentMetadata = (): Metadata => ({
    width: width,
    scale: scale / 100, // 0-100% -> 0-1
    marginTop: marginTop,
    marginRight: marginRight,
    marginBottom: marginBottom,
    marginLeft: marginLeft,
  });

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
          // scale 대신 metadata 객체 전달
          metadata: getCurrentMetadata(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "승인 처리 중 오류 발생");
      }

      toast({
        title: "성공",
        description: "채팅 칭호가 승인되었습니다.",
      });
      onSuccess(); // 부모 컴포넌트에 성공 알림 (데이터 새로고침 등)
      onOpenChange(false); // 다이얼로그 닫기
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
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
          // 거절 시에는 metadata를 보낼 필요 없음 (API에서 무시해야 함)
          margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "거절 처리 중 오류 발생");
      }

      toast({
        title: "성공",
        description: "채팅 칭호가 거절되었습니다.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
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
            <Label>미리보기</Label>
            <div className="border rounded-lg p-4 bg-muted/50 min-h-[80px] flex items-center justify-center">
              <ChatTitleExample
                imageSrc={imageUrl}
                metadata={getCurrentMetadata()}
              />
            </div>
          </div>

          {/* Editor Area */}
          <ScrollArea className="h-[400px] pr-4">
            {" "}
            {/* 스크롤 추가 */}
            <div className="space-y-4">
              {/* Width */}
              <div className="space-y-2">
                <Label htmlFor="width">너비 (Width)</Label>
                <Input
                  id="width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="예: 100px, 80%"
                />
                <p className="text-xs text-muted-foreground">
                  CSS 너비 값을 입력하세요 (예: 100px).
                </p>
              </div>

              {/* Scale */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="scale">크기 (Scale)</Label>
                  <span className="text-sm text-muted-foreground">
                    {scale.toFixed(0)}%
                  </span>
                </div>
                <Slider
                  id="scale"
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={50} // 최소 50%
                  max={150} // 최대 150%
                  step={1}
                />
              </div>

              {/* Margins */}
              <div className="space-y-2">
                <Label>여백 (Margin - px 단위)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="marginTop" className="text-xs">
                      상 (Top)
                    </Label>
                    <Input
                      id="marginTop"
                      type="number"
                      value={marginTop}
                      onChange={(e) =>
                        setMarginTop(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="marginRight" className="text-xs">
                      우 (Right)
                    </Label>
                    <Input
                      id="marginRight"
                      type="number"
                      value={marginRight}
                      onChange={(e) =>
                        setMarginRight(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="marginBottom" className="text-xs">
                      하 (Bottom)
                    </Label>
                    <Input
                      id="marginBottom"
                      type="number"
                      value={marginBottom}
                      onChange={(e) =>
                        setMarginBottom(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="marginLeft" className="text-xs">
                      좌 (Left)
                    </Label>
                    <Input
                      id="marginLeft"
                      type="number"
                      value={marginLeft}
                      onChange={(e) =>
                        setMarginLeft(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  채팅 메시지 기준 상대적 여백.
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
              {isProcessing ? "처리중..." : "거절"}
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "처리중..." : "승인 및 저장"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

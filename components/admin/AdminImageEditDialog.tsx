"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateImageAction, updateImageNameAction } from "@/actions/admin-image-actions";
import { toast } from "sonner";
import { Upload, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileToDataUrl, validateImageFile } from "@/lib/image-upload-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminImageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageId: number;
  initialName: string;
  type: "killfeed" | "chat";
  onSuccess?: () => void;
}

export default function AdminImageEditDialog({
  open,
  onOpenChange,
  imageId,
  initialName,
  type,
  onSuccess,
}: AdminImageEditDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      // image-upload-utils의 검증 로직 사용
      const maxSize = type === "killfeed" ? 500 * 1024 : 200 * 1024; // 킬피드: 500KB, 채팅칭호: 200KB
      const allowedTypes = ["image/png", "image/webp", "image/gif"];
      
      const validation = validateImageFile(selectedFile, maxSize, allowedTypes);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      // 이미지 차원 검증 (타입별)
      const dimensionCheck = await new Promise<{ valid: boolean; message?: string }>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          if (type === "killfeed") {
            // 킬피드: 정확히 640x140px
            if (img.width !== 640 || img.height !== 140) {
              resolve({ valid: false, message: "킬피드 이미지는 정확히 640x140px이어야 합니다." });
              return;
            }
          } else if (type === "chat") {
            // 채팅 칭호: 정확히 200x50px
            if (img.width !== 200 || img.height !== 50) {
              resolve({ valid: false, message: "채팅 칭호 이미지는 정확히 200x50px이어야 합니다." });
              return;
            }
          }
          resolve({ valid: true });
        };
        img.onerror = () => {
          resolve({ valid: false, message: "이미지를 로드하는 중 오류가 발생했습니다." });
        };
        img.src = URL.createObjectURL(selectedFile);
      });

      if (!dimensionCheck.valid) {
        toast.error(dimensionCheck.message);
        return;
      }

      // 미리보기 생성
      const dataUrl = await fileToDataUrl(selectedFile);
      setImagePreview(dataUrl);
      setFile(selectedFile);
    } catch (error) {
      console.error("파일 처리 오류:", error);
      toast.error("파일 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      let metadata: any = undefined;
      // chat-title은 메타데이터 추가
      if (type === "chat") {
        metadata = {
          width: "100px",
          scale: 0.7,
          marginTop: -5,
          marginRight: -10,
          marginBottom: 0,
          marginLeft: -10,
        };
      }

      // 파일과 이름 둘 다 있으면 updateImageAction 사용
      // 이름만 있으면 updateImageNameAction 사용
      let result: { success: boolean; error?: string; message?: string };
      
      if (file) {
        result = await updateImageAction({
          imageId,
          name: name.trim(),
          file,
          metadata
        });
      } else if (name.trim() !== initialName) {
        result = await updateImageNameAction(imageId, name.trim());
      } else {
        toast.error("변경할 내용이 없습니다.");
        return;
      }

      if (result.success) {
        toast.success(result.message);
        
        // 상태 초기화
        setFile(null);
        setImagePreview(null);
        setName(initialName);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (e: any) {
      console.error("수정 오류:", e);
      toast.error("수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>이미지 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 이미지 업로드 영역 */}
          <div>
            <Label className="text-sm font-medium">새 이미지</Label>
            <div className="mt-2">
              <div
                className={cn(
                  "relative flex h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                  imagePreview
                    ? "border-primary/20 bg-primary/5 hover:border-primary/30"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                )}
                onClick={handleClickUpload}
                role="button"
                tabIndex={0}
                aria-label="이미지 업로드"
              >
                {imagePreview ? (
                  /* 이미지 미리보기 */
                  <div className="relative h-full w-full">
                    <Image
                      src={imagePreview}
                      alt="미리보기"
                      fill
                      className="rounded object-cover"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute right-2 top-2 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            aria-label="이미지 제거"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>이미지 제거</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  /* 업로드 안내 */
                  <div className="flex flex-col items-center space-y-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Upload className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-700">
                        이미지 선택
                      </p>
                      <p className="text-xs text-neutral-500">
                        PNG, WebP, GIF ({type === "killfeed" ? "최대 500KB" : "최대 200KB"})
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 로딩 상태 */}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                    <div className="rounded-md bg-white p-2 text-sm font-medium">
                      처리 중...
                    </div>
                  </div>
                )}

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={loading}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* 이름 입력 */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              아이템 이름
            </Label>
            <Input
              id="name"
              placeholder="새 이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="mt-2"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
          >
            취소
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={loading || (!file && name.trim() === initialName)}
          >
            {loading ? "처리 중..." : file ? "수정" : "이름 변경"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

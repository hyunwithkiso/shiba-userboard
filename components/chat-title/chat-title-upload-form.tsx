"use client";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Upload, ArrowDown, CheckCircle, Loader2, AlertCircle, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChatTitleExample from "@/components/chat/chat-title-example";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatTitleUploadFormProps {
  onSuccess?: () => void;
}

export default function ChatTitleUploadForm({
  onSuccess,
}: ChatTitleUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // 중복 검사 상태
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateCheckMessage, setDuplicateCheckMessage] = useState("");
  
  // 고정된 값들
  const width = "100px"; // 고정값
  
  // 마진 값 (상단, 좌우만 조정 가능, 하단은 0 고정)
  const [marginTop, setMarginTop] = useState(-5);
  const [marginSide, setMarginSide] = useState(-10);
  const marginBottom = 0; // 고정값
  
  // 스케일 (50% ~ 150%)
  const [scale, setScale] = useState(70); // 70% 기본값
  
  const router = useRouter();

  // 중복 검사 함수
  const checkDuplicate = useCallback(async (name: string) => {
    if (!name.trim()) {
      setIsDuplicate(false);
      setDuplicateCheckMessage("");
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const response = await fetch(
        `/api/check/duplicate?name=${encodeURIComponent(name)}&type=chattitle`
      );
      const data = await response.json();
      
      setIsDuplicate(data.isDuplicate);
      setDuplicateCheckMessage(data.message);
    } catch (error) {
      console.error("중복 검사 오류:", error);
      setDuplicateCheckMessage("중복 검사를 수행할 수 없습니다.");
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, []);

  // 디바운싱된 중복 검사
  useEffect(() => {
    const timer = setTimeout(() => {
      if (imageName) {
        checkDuplicate(imageName);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [imageName, checkDuplicate]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // 이미지 미리보기 URL 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 최대 10글자까지만 입력 가능
    const value = e.target.value.slice(0, 10);
    setImageName(value);
  };

  const handleScaleChange = (value: number[]) => {
    setScale(value[0]);
  };

  // 고정된 마진 형식: -5px -10px 0
  const getMarginString = () => `${marginTop}px ${marginSide}px ${marginBottom}px`;

  const handleUploadClick = () => {
    if (!selectedFile) return;
    if (!imageName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    
    if (isDuplicate) {
      toast.error("이미 사용 중인 이름입니다.");
      return;
    }

    // 확인 모달 표시
    setShowConfirmDialog(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setShowConfirmDialog(false);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", imageName.trim());
      
      // 메타데이터를 JSON string으로 추가
      formData.append(
        "metadata",
        JSON.stringify({
          width,
          scale: scale / 100, // 0-1 범위로 변환
          marginTop,
          marginRight: marginSide,
          marginBottom,
          marginLeft: marginSide,
        })
      );

      const response = await fetch("/api/images/chat-title", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "업로드에 실패했습니다.");
      }

      setUploadSuccess(true);
      toast.success("이미지가 성공적으로 업로드되었습니다.");

      // 성공 상태를 3초간 표시 후 리다이렉트
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "업로드 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
              업로드 완료!
            </h3>
            <p className="text-emerald-700 dark:text-emerald-300">
              채팅 칭호가 성공적으로 업로드되었습니다.
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              관리자 검토 후 게임에 적용됩니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>3초 후 메인 페이지로 이동합니다...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-name">이미지 이름 (최대 10자)</Label>
          <div className="relative">
            <Input
              id="image-name"
              value={imageName}
              onChange={handleNameChange}
              placeholder="이미지 이름을 입력하세요"
              maxLength={10}
              disabled={isUploading}
              className={isDuplicate ? "pr-10 border-destructive" : "pr-10"}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isCheckingDuplicate ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : imageName && !isDuplicate ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : imageName && isDuplicate ? (
                <AlertCircle className="w-4 h-4 text-destructive" />
              ) : null}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {imageName.length}/10 자
            </p>
            {duplicateCheckMessage && (
              <p className={`text-xs ${isDuplicate ? "text-destructive" : "text-emerald-600"}`}>
                {duplicateCheckMessage}
              </p>
            )}
          </div>
        </div>

        <ImageUpload
          onFileSelect={handleFileSelect}
          maxSize={200 * 1024} // 200KB 제한
          acceptedTypes={["image/png", "image/webp", "image/gif"]}
          exactWidth={200}
          exactHeight={50}
        />
      </div>

      {/* 스타일 조정 UI */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-sm font-medium">스타일 조정</h3>
        
        {/* 크기 조절 (Scale) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="scale">크기 (Scale)</Label>
            <span className="text-sm text-muted-foreground">{scale}%</span>
          </div>
          <Slider
            id="scale"
            value={[scale]}
            onValueChange={handleScaleChange}
            min={50}
            max={150}
            step={5}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            채팅창에서의 크기를 조정합니다 (50% ~ 150%)
          </p>
        </div>

        {/* 여백 조정 */}
        <div className="space-y-3">
          <Label>여백 조정 (px)</Label>
          <div className="grid grid-cols-2 gap-4">
            {/* 상단 여백 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="marginTop" className="text-xs">상단 여백</Label>
                <span className="text-xs text-muted-foreground">{marginTop}px</span>
              </div>
              <Slider
                id="marginTop-slider"
                value={[marginTop]}
                onValueChange={(value) => setMarginTop(value[0])}
                min={-15}
                max={15}
                step={1}
                disabled={isUploading}
                className="mb-2"
              />
              <Input
                id="marginTop"
                type="number"
                value={marginTop}
                onChange={(e) => setMarginTop(Math.max(-15, Math.min(15, parseInt(e.target.value) || 0)))}
                min={-15}
                max={15}
                disabled={isUploading}
                className="text-xs h-8"
              />
            </div>
            
            {/* 좌우 여백 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="marginSide" className="text-xs">좌우 여백</Label>
                <span className="text-xs text-muted-foreground">{marginSide}px</span>
              </div>
              <Slider
                id="marginSide-slider"
                value={[marginSide]}
                onValueChange={(value) => setMarginSide(value[0])}
                min={-15}
                max={15}
                step={1}
                disabled={isUploading}
                className="mb-2"
              />
              <Input
                id="marginSide"
                type="number"
                value={marginSide}
                onChange={(e) => setMarginSide(Math.max(-15, Math.min(15, parseInt(e.target.value) || 0)))}
                min={-15}
                max={15}
                disabled={isUploading}
                className="text-xs h-8"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            마진 형식: <code className="bg-muted px-1 rounded">{getMarginString()}</code> (하단은 0으로 고정)
          </p>
        </div>

      </div>

      {imagePreview && (
        <div className="pt-4">
          <div className="flex items-center justify-center mb-3">
            <ArrowDown className="text-muted-foreground w-5 h-5" />
          </div>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-3">채팅창 미리보기</h3>
              <div className="border rounded-lg p-4 bg-background">
                <ChatTitleExample
                  imageSrc={imagePreview}
                  metadata={{
                    width,
                    scale: scale / 100,
                    margin: getMarginString(),
                  }}
                />
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  * 스타일을 조정하여 채팅창에서의 모습을 확인해보세요.
                </p>
                <p className="text-xs text-muted-foreground">
                  * 최종 승인 시 관리자가 추가 조정할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogTrigger asChild>
            <Button
              onClick={handleUploadClick}
              disabled={isUploading || !selectedFile || !imageName.trim() || isDuplicate}
              className="min-w-32"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  업로드
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>업로드 확인</AlertDialogTitle>
              <AlertDialogDescription>
                신청한 아이템 이름은 <strong>"{imageName} 채팅 칭호"</strong>로 생성됩니다.
                <br />
                계속 진행하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUpload}>
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

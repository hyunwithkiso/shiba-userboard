"use client";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Upload, ArrowDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChatTitleExample from "@/components/chat/chat-title-example";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface ChatTitleUploadFormProps {
  onSuccess?: () => void;
}

export default function ChatTitleUploadForm({
  onSuccess,
}: ChatTitleUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scale, setScale] = useState(0.7);
  const [width, setWidth] = useState("100px");
  const [marginTop, setMarginTop] = useState("-3px");
  const [marginRight, setMarginRight] = useState("-12px");
  const [marginBottom, setMarginBottom] = useState("0");
  const [marginLeft, setMarginLeft] = useState("0");
  const router = useRouter();

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
    setScale(value[0] / 100);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(e.target.value);
  };

  const handleMarginChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const getMarginString = () => `${marginTop} ${marginRight} ${marginBottom} ${marginLeft}`;

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!imageName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", imageName.trim());
      // metadata를 JSON string으로 추가
      formData.append(
        "metadata",
        JSON.stringify({
          width,
          scale,
          margin: getMarginString(),
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

      toast.success("이미지가 성공적으로 업로드되었습니다.");

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-name">이미지 이름 (최대 10자)</Label>
          <Input
            id="image-name"
            value={imageName}
            onChange={handleNameChange}
            placeholder="이미지 이름을 입력하세요"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground">
            {imageName.length}/10 자
          </p>
        </div>

        <ImageUpload
          onFileSelect={handleFileSelect}
          maxSize={500 * 1024}
          acceptedTypes={["image/png", "image/webp", "image/gif"]}
          previewWidth={180}
          previewHeight={40}
          minWidth={180}
          maxWidth={220}
          minHeight={40}
          maxHeight={50}
        />
      </div>

      {/* width, scale, margin 입력 UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">width (ex: 100px)</Label>
          <Input
            id="width"
            value={width}
            onChange={handleWidthChange}
            placeholder="100px"
          />
        </div>
        <div className="space-y-2">
          <Label>크기 조절 (scale)</Label>
          <Slider
            value={[scale * 100]}
            onValueChange={handleScaleChange}
            min={10}
            max={100}
            step={1}
          />
          <span className="text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>margin (상 우 하 좌, px 단위)</Label>
        <div className="grid grid-cols-4 gap-2">
          <Input
            value={marginTop}
            onChange={handleMarginChange(setMarginTop)}
            placeholder="상"
          />
          <Input
            value={marginRight}
            onChange={handleMarginChange(setMarginRight)}
            placeholder="우"
          />
          <Input
            value={marginBottom}
            onChange={handleMarginChange(setMarginBottom)}
            placeholder="하"
          />
          <Input
            value={marginLeft}
            onChange={handleMarginChange(setMarginLeft)}
            placeholder="좌"
          />
        </div>
        <span className="text-xs text-muted-foreground">예시: -3px -12px 0 0</span>
      </div>

      {imagePreview && (
        <div className="pt-4">
          <div className="flex items-center justify-center mb-2">
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
                    scale,
                    margin: getMarginString(),
                  }}
                />
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  * width, scale, margin을 조절해 채팅창에서의 모습을 확인해보세요. 최종 승인 시 관리자가 조정할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isUploading || !selectedFile || !imageName.trim()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "업로드 중..." : "업로드"}
        </Button>
      </div>
    </div>
  );
}

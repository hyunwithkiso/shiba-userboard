"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AlertCircle } from "lucide-react";
import ChatTitleExample from "@/components/chat/chat-title-example";
import { Card, CardContent } from "@/components/ui/card";

interface ImageEditorProps {
  imageSrc: string;
  onSave: (scale: number) => void;
  type: "chat" | "killfeed";
}

export default function ImageEditor({
  imageSrc,
  onSave,
  type,
}: ImageEditorProps) {
  const [scale, setScale] = useState<number>(type === "chat" ? 0.7 : 1.0);

  useEffect(() => {
    if (type === "chat") {
      onSave(scale);
    } else {
      onSave(1);
    }
  }, [scale, type, onSave]);

  const handleScaleChange = (value: number[]) => {
    if (type !== "chat") return;
    setScale(value[0]);
  };

  // 퍼센트 값을 표시할 때는 소수점 첫째 자리까지 보여줍니다
  const displayPercentage = (scaleValue: number) => {
    return (scaleValue * 100).toFixed(0) + "%";
  };

  return (
    <div className="space-y-6">
      {type === "chat" && (
        <>
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">
                  채팅 칭호 미리보기
                </Label>
                <div className="w-full overflow-x-auto py-2">
                  <ChatTitleExample
                    imageSrc={imageSrc}
                    metadata={{
                      width: "100px",
                      scale: scale,
                      margin: "-3px -12px 0",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                채팅 칭호 이미지의 크기는 70%~100% 사이에서 조절 가능하며,
                좌우 여백은 -100px~100px 사이에서 조절할 수 있습니다. 상하
                여백은 -3px로 고정됩니다.
              </AlertDescription>
            </Alert> */}

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-base">크기 조절</Label>
                      <span className="text-sm text-muted-foreground">
                        {displayPercentage(scale)}
                      </span>
                    </div>
                    <Slider
                      value={[scale]}
                      min={0.7}
                      max={1.0}
                      step={0.01}
                      onValueChange={handleScaleChange}
                      className="my-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      70% ~ 100% 사이에서 조절 가능
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

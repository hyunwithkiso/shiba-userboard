"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface GalleryItem {
  id: string;
  url: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  width?: number | null;
  height?: number | null;
  downloadCount?: number | null;
}

interface GalleryGridProps {
  items: GalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const handleImageClick = (item: GalleryItem) => {
    setSelectedImage(item);
  };

  const handleDownload = (item: GalleryItem) => {
    const link = document.createElement('a');
    link.href = `/api/gallery/download/${item.id}`;
    link.download = item.title || 'gallery-image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <div
              className="relative w-full pt-[56.25%] bg-muted cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(item)}
            >
              <img
                src={item.url}
                alt={item.title || "gallery image"}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {item.title || "이미지"}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title || "gallery image"}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              <div className="p-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {selectedImage.title || "이미지"}
                  </h3>
                  <Button
                    onClick={() => handleDownload(selectedImage)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

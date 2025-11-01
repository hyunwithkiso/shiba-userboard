"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { createPortal } from "react-dom";

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

  // Close on ESC and lock scroll when overlay is open
  useEffect(() => {
    if (!selectedImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [selectedImage]);

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

      {selectedImage && createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-[95vw] md:w-[90vw] max-w-[1600px] h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="닫기"
              className="absolute top-4 right-4 z-10 inline-flex items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/75 transition-colors p-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedImage.url}
              alt={selectedImage.title || "gallery image"}
              className="w-full h-full object-contain select-none"
              draggable={false}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
              <div className="pointer-events-auto rounded-md bg-black/50 text-white backdrop-blur-sm p-3 flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold truncate pr-4">
                  {selectedImage.title || "이미지"}
                </h3>
                <Button
                  onClick={() => handleDownload(selectedImage)}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/35"
                >
                  <Download className="w-4 h-4 mr-2" /> 다운로드
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

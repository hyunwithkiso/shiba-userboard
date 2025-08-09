"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadSubmission {
  id: number;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  type: "killfeed" | "chat-title";
  status: "pending" | "approved" | "rejected" | "processing";
  uploadedAt: Date;
  reason?: string | null;
}

interface MyUploadsClientProps {
  submissions: UploadSubmission[];
}

const ITEMS_PER_PAGE = 12;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function MyUploadsClient({ submissions }: MyUploadsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  // URL에서 페이지 파라미터 읽기
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
  }, [searchParams]);

  // 페이지 변경 시 URL 업데이트
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/my-uploads?${params.toString()}`);
  };

  // 페이지네이션 계산
  const totalItems = submissions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSubmissions = submissions.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-8">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-8">
        <div className="relative">
          <h1 className="text-3xl font-bold text-white mb-2">내 업로드 내역</h1>
          <p className="text-white/80">업로드한 킬피드 / 채팅 칭호 이미지를 확인하세요.</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>업로드 기록 없음</CardTitle>
            <CardDescription>아직 업로드한 이미지가 없습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              채팅 칭호나 킬피드 이미지를 업로드하면 여기에 목록이 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              총 {totalItems}개의 업로드 ({currentPage} / {totalPages} 페이지)
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {paginatedSubmissions.map((file) => (
              <Card key={file.id} className="overflow-hidden flex flex-col">
                {/* 이미지 썸네일 */}
                <div className="relative w-full h-40 bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.filePath}
                    alt={file.fileName}
                    className="object-contain max-h-full max-w-full"
                  />
                </div>
                <CardContent className="flex-1 flex flex-col p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate" title={file.fileName}>
                      {file.fileName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {file.type === "chat-title" ? "채팅 칭호" : "킬피드"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {file.fileSize ? formatFileSize(file.fileSize) : ""}
                  </div>
                  <div className="space-y-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        file.status === "approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : file.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : file.status === "processing"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {file.status === "pending"
                        ? "대기중"
                        : file.status === "approved"
                        ? "승인됨"
                        : file.status === "rejected"
                        ? "거절됨"
                        : file.status === "processing"
                        ? "처리중"
                        : file.status}
                    </span>
                    {file.reason && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded text-wrap break-words">
                        <strong>메모:</strong> {file.reason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              
              {/* 스마트 페이지네이션 */}
              {(() => {
                const delta = 2;
                const rangeWithDots: (number | string)[] = [];
                const start = Math.max(1, currentPage - delta);
                const end = Math.min(totalPages, currentPage + delta);

                if (start > 1) {
                  rangeWithDots.push(1);
                  if (start > 2) {
                    rangeWithDots.push('...');
                  }
                }

                for (let i = start; i <= end; i++) {
                  rangeWithDots.push(i);
                }

                if (end < totalPages) {
                  if (end < totalPages - 1) {
                    rangeWithDots.push('...');
                  }
                  rangeWithDots.push(totalPages);
                }

                return rangeWithDots.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${index}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(page as number)}
                    >
                      {page}
                    </Button>
                  );
                });
              })()}

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
              
              <div className="text-sm text-muted-foreground ml-4">
                {currentPage} / {totalPages} 페이지
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

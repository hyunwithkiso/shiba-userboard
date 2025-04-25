"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
}: PaginationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 표시할 페이지 범위 계산
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // 이전 및 다음 페이지 URL 생성
  const prevPageUrl = currentPage > 1 ? createPageUrl(currentPage - 1) : null;
  const nextPageUrl =
    currentPage < totalPages ? createPageUrl(currentPage + 1) : null;

  // 페이지 번호 계산 (최대 5개 표시)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i as never);
    }

    return pageNumbers;
  };

  // 페이지가 1페이지만 있으면 페이지네이션 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="페이지네이션"
      className="flex justify-center items-center space-x-1 mt-6"
    >
      {/* 이전 페이지 버튼 */}
      {prevPageUrl ? (
        <Button variant="outline" size="sm" asChild aria-label="이전 페이지">
          <Link href={prevPageUrl}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="이전 페이지 없음"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* 페이지 번호 버튼 */}
      {getPageNumbers().map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          asChild={page !== currentPage}
          aria-label={`${page}페이지`}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            "w-9",
            page === currentPage ? "pointer-events-none" : "hover:bg-muted"
          )}
        >
          {page !== currentPage ? (
            <Link href={createPageUrl(page)}>{page}</Link>
          ) : (
            page
          )}
        </Button>
      ))}

      {/* 다음 페이지 버튼 */}
      {nextPageUrl ? (
        <Button variant="outline" size="sm" asChild aria-label="다음 페이지">
          <Link href={nextPageUrl}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="다음 페이지 없음"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
};

export default Pagination;

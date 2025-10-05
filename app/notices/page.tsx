import Link from "next/link";
import { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isWithinInterval, parseISO } from "date-fns";
import { db, notices as noticesTable, users } from "@/lib/schema";
import { and, count, desc, eq, gte, lte, asc, sql, SQL } from "drizzle-orm";
import { checkAdmin } from "@/lib/auth-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pencil, BellRing, Sparkles, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/pagination";
import { NoticeFilters } from "@/components/filter/notice-filters";
import Image from "next/image";

// --- Constants ---
const ITEMS_PER_PAGE = 10;

// --- 데이터 타입 (실제 스키마 기반) ---
interface Notice {
  id: string;
  title: string;
  nickname: string;
  viewCount: number;
  isPinned: boolean;
  createdAt: Date;
}

// --- 로딩 스켈레톤 컴포넌트 ---
function NoticesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 w-full rounded-md" /> {/* 필터 영역 스켈레톤 */}
      <Skeleton className="h-12 w-full rounded-md" />
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">
                <Skeleton className="h-5 w-10 mx-auto" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-3/4" />
              </TableHead>
              <TableHead className="w-[150px] text-center">
                <Skeleton className="h-5 w-20 mx-auto" />
              </TableHead>
              <TableHead className="w-[100px] text-center">
                <Skeleton className="h-5 w-12 mx-auto" />
              </TableHead>
              <TableHead className="w-[120px] text-center">
                <Skeleton className="h-5 w-16 mx-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="text-center">
                  <Skeleton className="h-5 w-10 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-5 w-20 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-5 w-12 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-5 w-16 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Skeleton className="h-10 w-64 mx-auto" />
    </div>
  );
}

// 필터 파라미터 인터페이스
interface NoticeFilterParams {
  currentPage: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

// --- 게임 스타일 배너 컴포넌트 ---
function NoticeBanner({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg mb-8 bg-card border border-border">
      {/* 콘텐츠 */}
      <div className="relative py-12 px-8 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-4 mb-6 md:mb-0">
          <div className="flex items-center justify-center rounded-full bg-primary/10 p-3 border border-primary/20">
            <Megaphone className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center">
              공지사항
            </h1>
            <p className="text-muted-foreground max-w-lg">
              중요한 업데이트와 정보를 확인하세요. 게임 업데이트, 이벤트, 점검
              일정 등을 공유합니다.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 shadow-sm"
          >
            <Link href="/notices/new" className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />새 공지 작성
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// --- 데이터 로딩 및 테이블 렌더링 컴포넌트 ---
async function NoticesTable({
  currentPage,
  startDate,
  endDate,
  sort = "latest",
  isAdmin,
}: NoticeFilterParams & { isAdmin: boolean }) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 필터 조건 구성
  const whereConditions: SQL<unknown>[] = [];

  // 날짜 필터 적용
  if (startDate) {
    whereConditions.push(gte(noticesTable.createdAt, new Date(startDate)));
  }

  if (endDate) {
    // 종료일은 해당 일자의 끝(23:59:59)까지 포함
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    whereConditions.push(lte(noticesTable.createdAt, endDateTime));
  }

  // 정렬 조건 설정
  let orderByConditions = [desc(noticesTable.isPinned)]; // 항상 고정 공지가 먼저

  switch (sort) {
    case "oldest":
      orderByConditions.push(asc(noticesTable.createdAt));
      break;
    case "most-viewed":
      orderByConditions.push(desc(noticesTable.viewCount));
      break;
    case "least-viewed":
      orderByConditions.push(asc(noticesTable.viewCount));
      break;
    case "latest":
    default:
      orderByConditions.push(desc(noticesTable.createdAt));
      break;
  }

  // 쿼리 실행
  const query = db
    .select({
      id: noticesTable.id,
      title: noticesTable.title,
      nickname: noticesTable.nickname,
      viewCount: noticesTable.viewCount,
      isPinned: noticesTable.isPinned,
      createdAt: noticesTable.createdAt,
    })
    .from(noticesTable);

  // 필터 조건 적용
  if (whereConditions.length > 0) {
    query.where(and(...whereConditions));
  }

  // 정렬 및 페이지네이션 적용
  const fetchedNotices = await query
    .orderBy(...orderByConditions)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // 총 아이템 수 조회 쿼리 구성
  const countQuery = db.select({ count: count() }).from(noticesTable);

  if (whereConditions.length > 0) {
    countQuery.where(and(...whereConditions));
  }

  const totalCountResult = await countQuery;
  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <div className="border border-accent/30 rounded-md overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-accent/10">
            <TableRow>
              <TableHead className="w-[80px] text-center">번호</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[150px] text-center">작성자</TableHead>
              <TableHead className="w-[100px] text-center">조회수</TableHead>
              <TableHead className="w-[120px] text-center">작성일</TableHead>
              {isAdmin && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetchedNotices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="h-24 text-center"
                >
                  등록된 공지사항이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              fetchedNotices.map((notice, index) => (
                <TableRow
                  key={notice.id}
                  className={notice.isPinned ? "bg-primary/5" : undefined}
                >
                  <TableCell className="text-center">
                    {notice.isPinned ? (
                      <Badge
                        variant="destructive"
                        className="bg-primary/90 hover:bg-primary"
                      >
                        중요
                      </Badge>
                    ) : (
                      totalCount - offset - index
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/notices/${notice.id}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {notice.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    {notice.nickname || "관리자"}
                  </TableCell>
                  <TableCell className="text-center">
                    {notice.viewCount}
                  </TableCell>
                  <TableCell className="text-center">
                    {format(new Date(notice.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Link
                        href={`/notices/${notice.id}/edit`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon",
                        })}
                        aria-label="공지 수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 0 && (
        <Pagination
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
        />
      )}
    </>
  );
}

// 날짜 포맷팅 함수
function formatDate(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// --- 필터 요약 컴포넌트 ---
function FilterSummary({
  startDate,
  endDate,
  sort,
}: {
  startDate?: string;
  endDate?: string;
  sort?: string;
}) {
  if (!startDate && !endDate && (!sort || sort === "latest")) {
    return null;
  }

  const parts: string[] = [];

  // 날짜 범위 요약
  if (startDate || endDate) {
    if (startDate && endDate) {
      parts.push(`${formatDate(startDate)} ~ ${formatDate(endDate)}`);
    } else if (startDate) {
      parts.push(`${formatDate(startDate)} 이후`);
    } else if (endDate) {
      parts.push(`${formatDate(endDate)} 이전`);
    }
  }

  // 정렬 요약
  if (sort && sort !== "latest") {
    const sortLabels: Record<string, string> = {
      oldest: "오래된순",
      "most-viewed": "조회수 높은순",
      "least-viewed": "조회수 낮은순",
    };

    parts.push(sortLabels[sort] || "최신순");
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <BellRing className="w-4 h-4" />
      <span>{parts.join(" · ")}</span>
    </div>
  );
}

// --- 공지사항 페이지 컴포넌트 (Server Component) ---
export default async function NoticesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
  }>;
}) {
  // Next.js 15부터는 searchParams를 비동기로 가져와야 함
  // 비동기적으로 searchParams 접근

  const params = await searchParams;

  const currentPage = Number(params?.page) || 1;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const sort = params?.sort || "latest";

  const isAdmin = await checkAdmin(); // 관리자 여부 확인

  return (
    <main className="flex-1 py-24 md:py-24">
      <div className="container mx-auto max-w-4xl">
        {/* 게임 스타일 배너 */}
        <NoticeBanner isAdmin={isAdmin} />

        {/* 필터 영역 */}
        <div className="mb-6">
          <NoticeFilters />
        </div>

        {/* 필터 요약 */}
        <FilterSummary startDate={startDate} endDate={endDate} sort={sort} />

        {/* 공지사항 목록 테이블 (Suspense 적용) */}
        <Suspense fallback={<NoticesLoading />}>
          <NoticesTable
            currentPage={currentPage}
            startDate={startDate}
            endDate={endDate}
            sort={sort}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </main>
  );
}

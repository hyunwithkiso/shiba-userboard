import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { db, events as eventsTable } from "@/lib/schema";
import { count, desc, and, asc, gte, lte, SQL } from "drizzle-orm";
import { checkAdmin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Pagination from "@/components/pagination";
import { EventFilters } from "@/components/filter/event-filters";
import { FunnelIcon } from "lucide-react";
import { EventCard } from "@/components/event-card";

// --- Constants ---
const ITEMS_PER_PAGE = 9;
const DEFAULT_PAGE_SIZE = 16;
const MAX_PAGE_SIZE = 100;

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

// 이벤트 배너 컴포넌트
function EventBanner({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="relative w-full mb-8 overflow-hidden rounded-xl bg-card border border-border">
      {/* 배너 내용 */}
      <div className="relative px-6 py-12 md:px-10 md:py-16 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-full bg-primary/10 p-3 border border-primary/20">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              이벤트
            </h1>
            <p className="text-muted-foreground max-w-lg">
              다양한 이벤트에 참여하고 특별한 보상을 받아보세요
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            size="lg"
            className="mt-4 md:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 shadow-sm"
            asChild
          >
            <Link href="/events/new" className="flex items-center gap-2">
              <span>새 이벤트 작성</span>
              <Sparkles className="w-4 h-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// --- 로딩 스켈레톤 컴포넌트 ---
function EventsLoading() {
  return (
    <div>
      <Skeleton className="h-44 w-full rounded-md mb-8" />{" "}
      {/* 필터 영역 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <Skeleton className="h-full w-full" />
            </AspectRatio>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 필터 파라미터 인터페이스
interface EventFilterParams {
  currentPage: number;
  status?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  sort?: string;
}

// --- 이벤트 목록 컴포넌트 (Server Component) ---
async function EventList({
  currentPage,
  status,
  eventStartDate,
  eventEndDate,
  sort = "start-soon",
  isAdmin,
}: EventFilterParams & { isAdmin: boolean }) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const now = new Date();

  // 필터 조건 구성
  const whereConditions: SQL<unknown>[] = [];

  // 상태 필터 적용
  if (status) {
    switch (status) {
      case "upcoming":
        // 시작일이 현재보다 미래인 이벤트
        whereConditions.push(gte(eventsTable.startDate, now));
        break;
      case "ongoing":
        // 현재가 시작일과 종료일 사이인 이벤트
        whereConditions.push(lte(eventsTable.startDate, now));
        whereConditions.push(gte(eventsTable.endDate, now));
        break;
      case "ended":
        // 종료일이 현재보다 과거인 이벤트
        whereConditions.push(lte(eventsTable.endDate, now));
        break;
    }
  }

  // 날짜 필터 적용 (이벤트 기간에 해당하는 필터)
  if (eventStartDate) {
    const startDate = new Date(eventStartDate);
    // 이벤트 종료일이 필터 시작일 이후
    whereConditions.push(gte(eventsTable.endDate, startDate));
  }

  if (eventEndDate) {
    const endDate = new Date(eventEndDate);
    endDate.setHours(23, 59, 59, 999);
    // 이벤트 시작일이 필터 종료일 이전
    whereConditions.push(lte(eventsTable.startDate, endDate));
  }

  // 정렬 조건 설정
  let orderByConditions = [desc(eventsTable.isPinned)]; // 항상 고정 이벤트가 먼저

  switch (sort) {
    case "latest":
      orderByConditions.push(desc(eventsTable.createdAt));
      break;
    case "oldest":
      orderByConditions.push(asc(eventsTable.createdAt));
      break;
    case "end-soon":
      orderByConditions.push(asc(eventsTable.endDate));
      break;
    case "start-soon":
    default:
      orderByConditions.push(asc(eventsTable.startDate));
      break;
  }

  // 쿼리 실행
  const query = db
    .select({
      id: eventsTable.id,
      title: eventsTable.title,
      thumbnailImage: eventsTable.thumbnailImage,
      startDate: eventsTable.startDate,
      endDate: eventsTable.endDate,
      isPinned: eventsTable.isPinned,
    })
    .from(eventsTable);

  // 필터 조건 적용
  if (whereConditions.length > 0) {
    query.where(and(...whereConditions));
  }

  // 정렬 및 페이지네이션 적용
  const fetchedEvents = await query
    .orderBy(...orderByConditions)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // 총 아이템 수 조회 쿼리 구성
  const countQuery = db.select({ count: count() }).from(eventsTable);

  if (whereConditions.length > 0) {
    countQuery.where(and(...whereConditions));
  }

  const totalEventsResult = await countQuery;
  const totalEvents = totalEventsResult[0]?.count || 0;

  if (fetchedEvents.length === 0 && currentPage === 1) {
    return (
      <div className="space-y-4">
        <div className="col-span-full text-center py-10 text-muted-foreground">
          조건에 맞는 이벤트가 없습니다.
        </div>
        {totalEvents > 0 && (
          <Pagination
            totalItems={totalEvents}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fetchedEvents.map((event) => (
          <EventCard
            key={event.id}
            id={event.id}
            title={event.title}
            thumbnailImage={event.thumbnailImage}
            startDate={event.startDate}
            endDate={event.endDate}
            isPinned={event.isPinned}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <Pagination
        totalItems={totalEvents}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
      />
    </div>
  );
}

// --- 필터 요약 컴포넌트 ---
function FilterSummary({
  status,
  eventStartDate,
  eventEndDate,
  sort,
}: Pick<
  EventFilterParams,
  "status" | "eventStartDate" | "eventEndDate" | "sort"
>) {
  // "start-soon" 정렬 옵션이 선택되어 있으면서 다른 필터가 없으면 표시하지 않음
  if (sort === "start-soon" && !status && !eventStartDate && !eventEndDate) {
    return null;
  }

  // 적용된 필터가 아예 없으면 표시하지 않음
  if (!status && !eventStartDate && !eventEndDate && !sort) {
    return null;
  }

  const parts: string[] = [];

  // 상태 필터 텍스트 추가
  if (status) {
    if (status === "upcoming") {
      parts.push("예정된 이벤트");
    } else if (status === "ongoing") {
      parts.push("진행 중인 이벤트");
    } else if (status === "ended") {
      parts.push("종료된 이벤트");
    }
  }

  // 날짜 범위 필터 텍스트 추가
  if (eventStartDate && eventEndDate) {
    parts.push(`${formatDate(eventStartDate)} ~ ${formatDate(eventEndDate)}`);
  } else if (eventStartDate) {
    parts.push(`${formatDate(eventStartDate)} 이후`);
  } else if (eventEndDate) {
    parts.push(`${formatDate(eventEndDate)} 이전`);
  }

  // 정렬 조건 텍스트 추가 (시작임박순 제외)
  if (sort && sort !== "start-soon") {
    if (sort === "recently-registered") {
      parts.push("최근 등록순");
    } else if (sort === "likes") {
      parts.push("좋아요순");
    } else if (sort === "latest") {
      parts.push("최신순");
    } else if (sort === "oldest") {
      parts.push("오래된순");
    } else if (sort === "end-soon") {
      parts.push("종료임박순");
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
      <FunnelIcon className="w-4 h-4" />
      <span>{parts.join(" · ")}</span>
    </div>
  );
}

// --- 이벤트 페이지 컴포넌트 (Server Component) ---
export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    status?: string;
    eventStartDate?: string;
    eventEndDate?: string;
    sort?: string;
  }>;
}) {
  const {
    page = "",
    status = "",
    eventStartDate = "",
    eventEndDate = "",
    sort = "",
  } = (await searchParams) || {};
  const currentPage = Number(page) || 1;

  const isAdmin = await checkAdmin();

  return (
    <main className="flex-1 py-24 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* 이벤트 배너 */}
        <EventBanner isAdmin={isAdmin} />

        {/* 필터 영역 */}
        <div className="mb-6">
          <EventFilters />
        </div>

        {/* 필터 요약 */}
        <FilterSummary
          status={status}
          eventStartDate={eventStartDate}
          eventEndDate={eventEndDate}
          sort={sort}
        />

        {/* 이벤트 목록 */}
        <Suspense
          key={`${currentPage}-${status}-${eventStartDate}-${eventEndDate}-${sort}`}
          fallback={<EventsLoading />}
        >
          <EventList
            currentPage={currentPage}
            status={status}
            eventStartDate={eventStartDate}
            eventEndDate={eventEndDate}
            sort={sort}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </main>
  );
}

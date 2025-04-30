// app/page.tsx (Server Component)
import { Metadata } from "next";
import { HomeClientContent } from "@/components/home/home-client-content";
import { realtimeService } from "@/services/realtime-service";
import { db, notices, events } from "@/lib/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";

// 메타데이터 정의
export const metadata: Metadata = {
  title: "SHIBA | 유저보드",
  description:
    "현실적인 경제 시스템, 창의적인 컨텐츠, 그리고 커뮤니티 중심의 가상 세계를 경험하세요.",
};

// 메인 페이지 컴포넌트 (Server Component)
export default async function HomePage() {
  // 실시간 데이터 가져오기
  const { playerNum } = await realtimeService.getPlayersCount();
  const players = await realtimeService.getPlayers(); // user_id로 오름차순 정렬됨

  // 최신 공지사항 3개 가져오기
  const latestNotices = await db
    .select({
      id: notices.id,
      title: notices.title,
      createdAt: notices.createdAt,
      isPinned: notices.isPinned,
    })
    .from(notices)
    .orderBy(desc(notices.isPinned), desc(notices.createdAt))
    .limit(3);

  // 현재 날짜
  const now = new Date();

  // 진행 중인 이벤트 3개 가져오기 (현재 진행중 + 곧 시작하는 이벤트)
  const currentEvents = await db
    .select({
      id: events.id,
      title: events.title,
      thumbnailImage: events.thumbnailImage,
      startDate: events.startDate,
      endDate: events.endDate,
      isPinned: events.isPinned,
    })
    .from(events)
    .where(
      and(
        lte(
          events.startDate,
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        ), // 일주일 이내 시작하는 이벤트까지
        gte(events.endDate, now) // 아직 종료되지 않은 이벤트
      )
    )
    .orderBy(desc(events.isPinned), desc(events.startDate))
    .limit(3);

  // 타입 정의
  interface Player {
    user_id: number;
    name: string;
  }

  return (
    <HomeClientContent
      playerNum={playerNum}
      players={players as Player[]}
      notices={latestNotices}
      events={currentEvents}
    />
  );
}

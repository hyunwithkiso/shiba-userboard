// app/page.tsx (Server Component)
import { Metadata } from "next";
import { HomeClientContent } from "@/components/home/home-client-content";
import { realtimeService } from "@/services/realtime-service";
import { db, notices, events } from "@/lib/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth"; 
import { getCurrentUserData } from "@/lib/user-validation";
import { DiscordIntegrationRequired } from "@/components/auth/discord-integration-required";

// 메타데이터 정의
export const metadata: Metadata = {
  title: "SHIBA | 유저보드",
  description:
    "현실적인 경제 시스템, 창의적인 컨텐츠, 그리고 커뮤니티 중심의 가상 세계를 경험하세요.",
};

// 메인 페이지 컴포넌트 (Server Component)
export default async function HomePage() {
  // 현재 날짜 미리 계산
  const now = new Date();
  
  // 세션 및 사용자 데이터 확인
  const session = await auth();
  const userData = session ? await getCurrentUserData() : null;
  const isAuthenticated = !!session;
  const hasUserId = !!userData?.userId;
  const needsDiscordIntegration = isAuthenticated && !hasUserId;

  console.log(session, userData);
  
  // Discord 연동이 필요한 경우 인증 화면 표시
  if (needsDiscordIntegration) {
    return <DiscordIntegrationRequired />;
  }

  try {
    // 모든 데이터를 병렬로 가져오기
    const [
      playersCountResult,
      playersResult,
      latestNotices,
      currentEvents
    ] = await Promise.allSettled([
      // 실시간 데이터 (타임아웃 설정)
      Promise.race([
        realtimeService.getPlayersCount(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]),
      Promise.race([
        realtimeService.getPlayers(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]),
      
      // PostgreSQL 데이터
      db
        .select({
          id: notices.id,
          title: notices.title,
          createdAt: notices.createdAt,
          isPinned: notices.isPinned,
        })
        .from(notices)
        .orderBy(desc(notices.isPinned), desc(notices.createdAt))
        .limit(3),

      db
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
        .limit(3)
    ]);

    // 결과 처리 with fallback
    const playerNum = playersCountResult.status === 'fulfilled' 
      ? (playersCountResult.value as any)?.playerNum || 0 
      : 0;

    const players = playersResult.status === 'fulfilled' 
      ? (playersResult.value as any) || [] 
      : [];

    const noticesData = latestNotices.status === 'fulfilled' 
      ? latestNotices.value 
      : [];

    const eventsData = currentEvents.status === 'fulfilled' 
      ? currentEvents.value 
      : [];

    // 실패한 요청 로깅 (개발용)
    if (playersCountResult.status === 'rejected') {
      console.warn('플레이어 수 조회 실패:', playersCountResult.reason);
    }
    if (playersResult.status === 'rejected') {
      console.warn('플레이어 목록 조회 실패:', playersResult.reason);
    }

    // 타입 정의
    interface Player {
      user_id: number;
      name: string;
    }

    return (
      <HomeClientContent
        playerNum={playerNum}
        players={players as Player[]}
        notices={noticesData}
        events={eventsData}
      />
    );
  } catch (error) {
    console.error('메인 페이지 데이터 로딩 실패:', error);
    
    // 에러 발생 시 fallback 데이터로 렌더링
    return (
      <HomeClientContent
        playerNum={0}
        players={[]}
        notices={[]}
        events={[]}
      />
    );
  }
}

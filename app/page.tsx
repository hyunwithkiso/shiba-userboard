// app/page.tsx (Server Component)
import { Metadata } from "next";
import { HomeClientContent } from "@/components/home/home-client-content";
import { realtimeService } from "@/services/realtime-service";

// 메타데이터 정의
export const metadata: Metadata = {
  title: "SHIBA | 온라인 게임 커뮤니티",
  description:
    "현실적인 경제 시스템, 창의적인 컨텐츠, 그리고 커뮤니티 중심의 가상 세계를 경험하세요.",
};

// 메인 페이지 컴포넌트 (Server Component)
export default async function HomePage() {
  // 실시간 데이터 가져오기
  const { playerNum } = await realtimeService.getPlayersCount();
  const players = await realtimeService.getPlayers(); // user_id로 오름차순 정렬됨

  // 타입 정의
  interface Player {
    user_id: number;
    name: string;
  }

  return (
    <HomeClientContent playerNum={playerNum} players={players as Player[]} />
  );
}

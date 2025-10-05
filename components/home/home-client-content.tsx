"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BackGroundImage from "@/assets/background-logo.webp";
import {
  ExternalLink,
  Gamepad2,
  ChevronRight,
  Info,
  CalendarDays,
  Search,
  Clock,
  PinIcon,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// --- Helper Function for Avatar Background ---
const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];
const getAvatarColor = (id: number) => {
  return colors[id % colors.length];
};

// --- Props Interface (API 응답 구조에 맞게 수정) ---
interface Player {
  user_id: number; // 유저 고유 ID (정렬 기준)
  name: string; // 플레이어 이름
}

interface Notice {
  id: string;
  title: string;
  createdAt: Date;
  isPinned: boolean;
}

interface Event {
  id: string;
  title: string;
  thumbnailImage: string | null;
  startDate: Date;
  endDate: Date;
  isPinned: boolean;
}

interface HomeClientContentProps {
  playerNum: number;
  players: Player[]; // 이미 user_id 기준으로 정렬된 플레이어 배열
  notices: Notice[];
  events: Event[];
}

// --- Client Component for Home Page Content ---
export const HomeClientContent = ({
  playerNum,
  players,
  notices,
  events,
}: HomeClientContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // 검색어에 따라 플레이어 필터링
  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.user_id.toString().includes(searchQuery)
  );

  // 검색어 입력 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // 날짜 포맷팅 함수
  const formatEventDate = (date: Date) => {
    return format(new Date(date), "MM월 dd일", { locale: ko });
  };

  // 진행 중/예정/종료 상태 확인
  const getEventStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    if (now < new Date(startDate)) {
      return "upcoming";
    } else if (now > new Date(endDate)) {
      return "ended";
    } else {
      return "ongoing";
    }
  };

  return (
    <main className="flex-1">
      {/* 게임 스타일 Hero Section - 전체 화면 */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0">
          <Image
            src={BackGroundImage}
            alt="SHIBA Background"
            fill
            className="object-cover"
            priority
          />
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-10 mix-blend-soft-light"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"></div>

        {/* 장식 요소 */}
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50">
          <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-75 animation-delay-1000"></div>
        </div>

        {/* 컨텐츠 - 중앙 정렬 */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center space-y-8 px-6">
            <Badge
              variant="secondary"
              className="bg-blue-500/30 text-blue-50 border-blue-400/30 backdrop-blur-sm text-lg px-6 py-2"
            >
              실시간 접속자 {playerNum}명
            </Badge>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white">
              2025{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] filter">
                SHIBA
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white font-medium max-w-2xl mx-auto drop-shadow-lg">
              현실적인 경제 시스템, 창의적인 컨텐츠, 그리고 <br />
              커뮤니티 중심의 환경을 즐겨보세요.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0 justify-center">
              <Link href="fivem://connect/141.11.194.130">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-2xl shadow-blue-500/25 border-0 text-lg px-8 py-4 h-auto"
                >
                  게임 접속하기
                </Button>
              </Link>
              <Link href="https://discord.gg/shibarp" target="_blank">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-blue-400/50 text-blue-100 hover:bg-blue-500/20 hover:text-white backdrop-blur-sm text-lg px-8 py-4 h-auto"
                >
                  디스코드 참여
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 현재 접속 중과 공지사항을 2 col grid로 배치 */}
      <div className="container mx-auto max-w-7xl py-16 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Users Section */}
          <section className="relative">
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      현재 접속 중
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      실시간 접속 플레이어
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Simple player count badge */}
              <div className="bg-background border border-border rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-lg font-semibold text-foreground">
                    {playerNum}명
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">온라인</p>
              </div>
            </div>

            {/* Clean card design */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="플레이어 검색..."
                    className="pl-10 border-border focus:border-primary focus:ring-1 focus:ring-primary"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="h-96 overflow-y-auto pr-2">
                  {filteredPlayers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                      <div className="p-4 rounded-full bg-muted">
                        <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-medium text-muted-foreground">
                          {searchQuery ? "검색 결과가 없습니다" : "접속 중인 유저가 없습니다"}
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                          {searchQuery ? "다른 검색어를 시도해보세요" : "잠시 후 다시 확인해주세요"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPlayers.map((player) => (
                        <div
                          key={player.user_id}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback
                              className={`${getAvatarColor(
                                player.user_id
                              )} text-white text-xs font-medium`}
                            >
                              {player.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {player.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {player.user_id}
                            </p>
                          </div>
                          
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Notices Section */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    공지사항
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    SHIBA의 최신 소식
                  </p>
                </div>
              </div>
              <Link
                href="/notices"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-sm"
              >
                <span className="text-muted-foreground">더보기</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
            
            <Card className="border border-border shadow-sm">
              <CardContent className="p-6">
                {notices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-12">
                    <div className="p-4 rounded-full bg-muted">
                      <Info className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">등록된 공지사항이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notices.map((notice) => (
                      <Link
                        key={notice.id}
                        href={`/notices/${notice.id}`}
                        className="block p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              {notice.isPinned && (
                                <Badge variant="secondary" className="text-xs">
                                  <PinIcon className="h-3 w-3 mr-1" />
                                  중요
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground line-clamp-2">
                              {notice.title}
                            </h3>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(notice.createdAt), "MM월 dd일", { locale: ko })}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
};

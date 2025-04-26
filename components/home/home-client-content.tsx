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
    <main className="flex-1 py-8 md:py-12">
      {/* 게임 스타일 Hero Section */}
      <section className="container mx-auto max-w-7xl mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-cyan-800 to-blue-800">
          {/* 배경 효과 */}
          <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-20 mix-blend-soft-light"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"></div>

          {/* 장식 요소 */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-blue-300 rounded-full shadow-lg shadow-blue-500/50">
            <div className="absolute inset-0 rounded-full animate-ping bg-blue-300 opacity-75"></div>
          </div>
          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50">
            <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-75 animation-delay-1000"></div>
          </div>

          {/* 컨텐츠 */}
          <div className="relative z-10 px-6 py-12 md:px-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* 왼쪽 텍스트 영역 */}
            <div className="flex flex-col items-start space-y-6">
              <Badge
                variant="secondary"
                className="bg-blue-500/30 text-blue-50 border-blue-400/30 backdrop-blur-sm"
              >
                실시간 접속자 {playerNum}명
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl xl:text-6xl text-white">
                2025{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  SHIBA
                </span>
              </h1>
              <p className="text-lg text-blue-50/90">
                현실적인 경제 시스템, 창의적인 컨텐츠, 그리고 커뮤니티 중심의
                환경을 즐겨보세요.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link href="fivem://connect/95.214.178.186">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/20 shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
                    aria-label="게임 시작하기"
                  >
                    <Gamepad2 className="mr-2 h-5 w-5" />
                    게임 시작하기
                  </Button>
                </Link>
                <Link href="https://docs.dokku.co.kr/shiba" passHref>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-blue-300/30 hover:text-white hover:bg-blue-800/50 backdrop-blur-sm"
                    aria-label="SHIBA 문서 바로가기"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    SHIBA 문서 바로가기
                  </Button>
                </Link>
              </div>
            </div>

            {/* 오른쪽 이미지 영역 */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-1000"></div>
                <Image
                  src={BackGroundImage}
                  alt="SHIBA Hero Image"
                  width={500}
                  height={400}
                  className="relative rounded-lg object-cover shadow-2xl group-hover:scale-[1.01] transition duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Users Section - 카드 디자인 통일 */}
      <section className="container mx-auto max-w-7xl mb-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              현재 접속 중
            </h2>
            <p className="text-sm text-muted-foreground">
              현재 게임에 접속 중인 플레이어
            </p>
          </div>
          <span className="text-lg font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {playerNum}명
          </span>
        </div>
        <Card className="border-blue-500/20 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r ">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="플레이어 이름 또는 ID 검색..."
                className="pl-9 bg-background/80 backdrop-blur-sm border-blue-500/20 focus:border-blue-500/40 focus:ring-blue-500/30"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-96 overflow-y-auto overflow-x-hidden pr-2">
              {filteredPlayers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-muted-foreground">
                    {searchQuery
                      ? "검색 결과가 없습니다."
                      : "접속 중인 유저가 없습니다."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.user_id}
                      className="flex items-center space-x-3 rounded-md border border-blue-500/10 p-3 bg-background hover:bg-blue-900/5 transition-colors"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-blue-500/20">
                        <AvatarFallback
                          className={`${getAvatarColor(
                            player.user_id
                          )} text-white text-xs font-medium`}
                        >
                          {player.name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none truncate">
                          {player.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {player.user_id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 카드 디자인 통일된 공지사항 및 이벤트 섹션 */}
      <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Notices Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                공지사항
              </h2>
              <p className="text-sm text-muted-foreground">
                SHIBA의 최신 소식을 확인하세요
              </p>
            </div>
            <Link
              href="/notices"
              className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline flex items-center bg-blue-500/10 px-3 py-1 rounded-full"
            >
              더보기 <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <Card className="border-blue-500/20 shadow-lg h-[280px] overflow-hidden">
            <CardContent className="pt-6 h-full flex flex-col">
              {notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-muted-foreground h-full">
                  <div className="p-4 rounded-full bg-blue-500/5 border border-blue-500/10">
                    <Info className="h-8 w-8 text-blue-500/70" />
                  </div>
                  <span>등록된 공지사항이 없습니다</span>
                </div>
              ) : (
                <ul className="space-y-3">
                  {notices.map((notice) => (
                    <li key={notice.id}>
                      <Link
                        href={`/notices/${notice.id}`}
                        className="block p-3 rounded-lg border border-blue-500/10 hover:bg-blue-500/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {notice.isPinned && (
                            <Badge variant="destructive" className="text-xs">
                              <PinIcon className="h-3 w-3 mr-1" />
                              중요
                            </Badge>
                          )}
                          <h3 className="font-medium text-primary line-clamp-1">
                            {notice.title}
                          </h3>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(
                            new Date(notice.createdAt),
                            "yyyy년 MM월 dd일",
                            { locale: ko }
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Events Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                진행중인 이벤트
              </h2>
              <p className="text-sm text-muted-foreground">
                특별한 이벤트에 참여하고 보상을 받아가세요
              </p>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline flex items-center bg-blue-500/10 px-3 py-1 rounded-full"
            >
              더보기 <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <Card className="border-blue-500/20 shadow-lg h-[280px] overflow-hidden">
            <CardContent className="pt-6 h-full flex flex-col">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-muted-foreground h-full">
                  <div className="p-4 rounded-full bg-blue-500/5 border border-blue-500/10">
                    <CalendarDays className="h-8 w-8 text-blue-500/70" />
                  </div>
                  <span>진행 중인 이벤트가 없습니다</span>
                </div>
              ) : (
                <ul className="space-y-3">
                  {events.map((event) => {
                    const status = getEventStatus(
                      event.startDate,
                      event.endDate
                    );

                    return (
                      <li key={event.id}>
                        <Link
                          href={`/events/${event.id}`}
                          className="flex items-start gap-3 p-3 rounded-lg border border-blue-500/10 hover:bg-blue-500/5 transition-colors"
                        >
                          <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-blue-500/10 flex items-center justify-center">
                            {event.thumbnailImage ? (
                              <Image
                                src={event.thumbnailImage}
                                alt={event.title}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <CalendarDays className="h-8 w-8 text-blue-500/70" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {event.isPinned && (
                                <Badge
                                  variant="default"
                                  className="bg-primary/80 text-xs"
                                >
                                  <PinIcon className="h-3 w-3 mr-1" />
                                  중요
                                </Badge>
                              )}
                              {status === "ongoing" ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-500/80 text-white text-xs"
                                >
                                  진행중
                                </Badge>
                              ) : status === "upcoming" ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-500/80 text-white text-xs"
                                >
                                  예정
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  종료
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-primary line-clamp-1">
                              {event.title}
                            </h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {formatEventDate(event.startDate)} ~{" "}
                              {formatEventDate(event.endDate)}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

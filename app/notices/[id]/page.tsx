import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { notices } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkAdmin } from "@/lib/auth-utils";
import { ViewCounter } from "@/components/view-counter";

// TODO: 실제 사용자 인증 및 권한 확인 로직 추가 -> checkAdmin으로 일부 대체

interface NoticeDetail {
  id: string;
  title: string;
  content: string; // any -> string 변경
  nickname: string;
  viewCount: number;
  isPinned: boolean;
  createdAt: Date;
  // 필요 시 updatedAt 등 추가
}

// 데이터 로딩 함수
async function getNoticeDetail(id: string): Promise<NoticeDetail | null> {
  // 조회수 증가 로직 제거
  // try {
  //   await db
  //     .update(notices)
  //     .set({ viewCount: sql`${notices.viewCount} + 1` }) // SQL 함수 사용으로 수정
  //     .where(eq(notices.id, id));
  // } catch (error) {
  //   console.error("Error incrementing view count:", error);
  //   // 조회수 증가 실패가 페이지 로딩을 막아서는 안 됨
  // }

  const result = await db
    .select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      nickname: notices.nickname,
      viewCount: notices.viewCount,
      isPinned: notices.isPinned,
      createdAt: notices.createdAt,
    })
    .from(notices)
    .where(eq(notices.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }
  // content 타입이 string으로 변경되었으므로 타입 단언 수정/제거 가능
  return result[0]; // result[0] as NoticeDetail -> result[0] 변경 (타입 추론 활용)
}

// 페이지 컴포넌트 (Server Component)
export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeDetail(id);

  if (!notice) {
    notFound();
  }

  // MarkdownIt 로직 제거
  // const md = new MarkdownIt();
  // const contentToRender = ...;
  // const contentHtml = md.render(contentToRender);

  const isAdmin = await checkAdmin(); // 관리자 여부 확인
  // const canEdit = true; // 임시 로직 제거
  const canEdit = isAdmin; // 실제 관리자 권한으로 수정 버튼 표시 여부 결정

  return (
    <main className="flex-1 py-24 md:py-24">
      <ViewCounter type="notice" itemId={id} />
      <div className="container mx-auto max-w-4xl px-4">
        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/notices"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록으로 돌아가기
          </Link>
          {canEdit && (
            <Link href={`/notices/${notice.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                수정
              </Button>
            </Link>
          )}
        </div>

        {/* 공지사항 헤더 */}
        <div className="mb-8 pb-4 border-b border-border">
          {notice.isPinned && (
            <Badge variant="destructive" className="mb-2">
              중요
            </Badge>
          )}
          <h1 className="text-3xl font-bold mb-2">{notice.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>작성자: {notice.nickname}</span>
            <span>
              작성일: {format(new Date(notice.createdAt), "yyyy.MM.dd")}
            </span>
            <span>조회수: {notice.viewCount}</span>
          </div>
        </div>

        {/* 공지사항 내용 (ReactMarkdown 사용) */}
        <div className="p-6 bg-card rounded-lg shadow-sm">
          <article className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notice.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </main>
  );
}

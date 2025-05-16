import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/schema";
import { events } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { ArrowLeft, Pencil, CalendarIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkAdmin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { ViewCounter } from "@/components/view-counter";

interface EventDetail {
  id: string;
  title: string;
  content: string;
  nickname: string;
  viewCount: number;
  isPinned: boolean;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  thumbnailImage: string | null;
}

async function getEventDetail(id: string): Promise<EventDetail | null> {
  const result = await db
    .select({
      id: events.id,
      title: events.title,
      content: events.content,
      nickname: events.nickname,
      viewCount: events.viewCount,
      isPinned: events.isPinned,
      createdAt: events.createdAt,
      startDate: events.startDate,
      endDate: events.endDate,
      thumbnailImage: events.thumbnailImage,
    })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }
  return result[0];
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventDetail(id);

  if (!event) {
    notFound();
  }

  const isAdmin = await checkAdmin();
  const canEdit = isAdmin;

  return (
    <main className="flex-1 py-8 md:py-12">
      <ViewCounter type="event" itemId={id} />
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/events"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록으로 돌아가기
          </Link>
          {canEdit && (
            <Link href={`/events/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                수정
              </Button>
            </Link>
          )}
        </div>

        <div className="mb-8 pb-4 border-b border-border">
          {event.isPinned && (
            <Badge variant="destructive" className="mb-2">
              중요
            </Badge>
          )}
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>작성자: {event.nickname}</span>
              <span>
                작성일: {format(new Date(event.createdAt), "yyyy.MM.dd")}
              </span>
              <span>조회수: {event.viewCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {format(new Date(event.startDate), "yyyy.MM.dd HH:mm")} ~{" "}
                {format(new Date(event.endDate), "yyyy.MM.dd HH:mm")}
              </span>
            </div>
          </div>
        </div>

        {event.thumbnailImage && (
          <div className="mb-8 relative aspect-video overflow-hidden rounded-lg shadow-sm">
            <Image
              src={event.thumbnailImage}
              alt={`${event.title} 썸네일`}
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}

        <div className="p-6 bg-card rounded-lg shadow-sm">
          <article className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {event.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </main>
  );
}

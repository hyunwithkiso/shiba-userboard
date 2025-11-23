import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { buttonVariants } from "@/components/ui/button";
import { Calendar, Clock, Pencil } from "lucide-react";
import { format, isWithinInterval, isAfter, isBefore } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  thumbnailImage: string | null;
  startDate: Date;
  endDate: Date;
  isPinned: boolean;
  isAdmin: boolean;
}

export function EventCard({
  id,
  title,
  thumbnailImage,
  startDate,
  endDate,
  isPinned,
  isAdmin,
}: EventCardProps) {
  const now = new Date();

  const isEventInProgress = isWithinInterval(now, {
    start: new Date(startDate),
    end: new Date(endDate),
  });

  const isUpcoming = isAfter(new Date(startDate), now);
  const isEnded = isBefore(new Date(endDate), now);

  return (
    <Card className="overflow-hidden relative group p-0 border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col">
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
        {isPinned && <Badge variant="destructive" className="shadow-sm">고정</Badge>}
        {isEventInProgress && (
          <Badge
            variant="outline"
            className="border-green-500/30 text-green-600 bg-green-500/10 backdrop-blur-sm shadow-sm"
          >
            진행중
          </Badge>
        )}
        {isUpcoming && (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 bg-blue-500/10 backdrop-blur-sm shadow-sm"
          >
            예정
          </Badge>
        )}
        {isEnded && (
          <Badge
            variant="outline"
            className="border-gray-500/30 text-gray-500 bg-gray-500/10 backdrop-blur-sm shadow-sm"
          >
            종료
          </Badge>
        )}
      </div>

      {isAdmin && (
        <Link
          href={`/events/${id}/edit`}
          className={`${buttonVariants({
            variant: "secondary",
            size: "icon",
          })} absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg translate-y-2 group-hover:translate-y-0`}
          aria-label="이벤트 수정"
          tabIndex={0}
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      <Link
        href={`/events/${id}`}
        className="flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-lg"
        tabIndex={0}
        aria-label={`이벤트: ${title}`}
      >
        <div className="relative w-full aspect-video overflow-hidden bg-muted">
          {thumbnailImage ? (
            <>
              <Image
                src={thumbnailImage}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                quality={100}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <Calendar className="w-12 h-12 opacity-20" />
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-5 flex flex-col justify-between bg-card relative z-10">
          <div>
            <CardTitle className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
              {title}
            </CardTitle>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground/80 mt-auto pt-4 border-t border-border/50">
            <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-primary/70" />
            <span className="font-medium text-xs">
              {format(new Date(startDate), "yyyy.MM.dd")} ~{" "}
              {format(new Date(endDate), "yyyy.MM.dd")}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

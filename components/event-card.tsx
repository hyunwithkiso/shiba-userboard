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
    <Card className="overflow-hidden relative group p-0 hover:shadow-md transition-shadow duration-300">
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
        {isPinned && <Badge variant="destructive">고정</Badge>}
        {isEventInProgress && (
          <Badge
            variant="outline"
            className="border-green-600 text-green-600 bg-green-50"
          >
            진행중
          </Badge>
        )}
        {isUpcoming && (
          <Badge
            variant="outline"
            className="border-blue-600 text-blue-600 bg-blue-50"
          >
            예정
          </Badge>
        )}
        {isEnded && (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-gray-50"
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
          })} absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity`}
          aria-label="이벤트 수정"
          tabIndex={0}
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      <Link
        href={`/events/${id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-lg"
        tabIndex={0}
        aria-label={`이벤트: ${title}`}
      >
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {thumbnailImage ? (
            <Image
              src={thumbnailImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              quality={100}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100">
              <Calendar className="w-10 h-10" />
            </div>
          )}
        </AspectRatio>

        <CardContent className="p-4">
          <CardTitle className="text-lg mb-2 truncate group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <div className="flex items-center text-sm text-muted-foreground space-x-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {format(new Date(startDate), "yyyy.MM.dd HH:mm")} ~{" "}
              {format(new Date(endDate), "yyyy.MM.dd HH:mm")}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

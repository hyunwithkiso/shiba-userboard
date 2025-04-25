import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, killfeedSubmission, chatTitleSubmission } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";
import { formatFileSize } from "@/lib/utils";
import { FileIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "내 업로드 내역 | SHIBA 유저보드",
  description: "내가 업로드한 이미지 목록을 확인합니다.",
};

type BaseSubmission = typeof killfeedSubmission.$inferSelect;

interface SubmissionWithType extends BaseSubmission {
  type: "killfeed" | "chat-title";
}

export default async function MyUploadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const uploaderId = session.user.id;

  let submissions: SubmissionWithType[] = [];
  try {
    const [killfeedUploads, chatTitleUploads] = await Promise.all([
      db
        .select()
        .from(killfeedSubmission)
        .where(eq(killfeedSubmission.userId, uploaderId))
        .orderBy(desc(killfeedSubmission.uploadedAt)),
      db
        .select()
        .from(chatTitleSubmission)
        .where(eq(chatTitleSubmission.userId, uploaderId))
        .orderBy(desc(chatTitleSubmission.uploadedAt)),
    ]);

    submissions = [
      ...killfeedUploads.map((upload) => ({
        ...upload,
        type: "killfeed" as const,
      })),
      ...chatTitleUploads.map((upload) => ({
        ...upload,
        type: "chat-title" as const,
      })),
    ].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  } catch (error) {
    console.error("Failed to fetch user uploads:", error);
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 text-center">
        <p className="text-red-500">
          업로드 내역을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-6">내 업로드 내역</h1>

      {submissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>업로드 기록 없음</CardTitle>
            <CardDescription>아직 업로드한 이미지가 없습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              채팅 칭호나 킬피드 이미지를 업로드하면 여기에 목록이 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead className="w-[100px] text-center">유형</TableHead>
                  <TableHead className="w-[120px] text-right">크기</TableHead>
                  <TableHead className="w-[150px] text-center">
                    업로드 날짜
                  </TableHead>
                  <TableHead className="w-[100px] text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="text-center">
                      <FileIcon className="h-5 w-5 text-muted-foreground mx-auto" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {file.fileName}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {file.type === "chat-title" ? "채팅 칭호" : "킬피드"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {format(new Date(file.uploadedAt), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          file.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : file.status === "rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : file.status === "processing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {file.status === "pending"
                          ? "대기중"
                          : file.status === "approved"
                          ? "승인됨"
                          : file.status === "rejected"
                          ? "거절됨"
                          : file.status === "processing"
                          ? "처리중"
                          : file.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ChatTitleExample from "@/components/chat/chat-title-example";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatFileSize } from "@/lib/utils";
import { Info, Trash2, ExternalLink } from "lucide-react";
import { deleteImage } from "@/actions/image-action";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ImageApprovalButton } from "@/components/admin/image-approval-button";
import ChatTitleDialog from "@/components/admin/chat-title-dialog";

interface Submission {
  id: string;
  userId: string;
  userNickname: string;
  type: "killfeed" | "chat";
  filePath: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
  reviewedAt: string | null;
  reviewerId: string | null;
  reviewerNickname: string | null;
  reviewerUserId: string | null;
  adminNotes: string | null;
  marginX?: number;
  scale?: number;
  userGameId: string | null;
}

interface AdminImagesClientProps {
  submissions: Submission[];
  currentPage: number;
  totalPages: number;
  currentType: string;
  currentStatus: string;
}

export default function AdminImagesClient({
  submissions,
  currentPage,
  totalPages,
  currentType,
  currentStatus,
}: AdminImagesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScale, setEditedScale] = useState<number>(70);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedStatus, setEditedStatus] = useState<string>("pending");
  const [editedNotes, setEditedNotes] = useState<string>("");
  const [type, setType] = useState(currentType);
  const [status, setStatus] = useState(currentStatus);
  const [chatTitleDialogOpen, setChatTitleDialogOpen] = useState(false);
  const [selectedChatTitle, setSelectedChatTitle] = useState<{
    id: string;
    url: string;
  } | null>(null);

  const handleTypeChange = (value: string) => {
    setType(value);
    const searchParams = new URLSearchParams({
      type: value,
      status: status,
      page: "1",
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    const searchParams = new URLSearchParams({
      type: type,
      status: value,
      page: "1",
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams({
      type: type,
      status: status,
      page: String(page),
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handleEdit = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditedScale(submission.scale ? submission.scale * 100 : 70);
    setEditedStatus(submission.status);
    setEditedNotes(submission.adminNotes || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/images/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedSubmission.id,
          type: selectedSubmission.type,
          status: editedStatus,
          adminNotes: editedNotes,
          scale:
            selectedSubmission.type === "chat" ? editedScale / 100 : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      toast({
        title: "변경사항이 저장되었습니다.",
        description: "이미지 정보가 성공적으로 업데이트되었습니다.",
      });

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다.",
        description: "변경사항을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedSubmission) return;

    try {
      setIsDeleting(true);
      const response = await deleteImage(
        selectedSubmission.id,
        selectedSubmission.type
      );

      if (!response) {
        throw new Error("이미지 삭제 실패");
      }

      toast({
        title: "이미지 삭제 완료",
        description: "이미지가 완전히 삭제되었습니다.",
      });

      setIsDeleting(false);
      setSelectedSubmission(null);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description:
          error instanceof Error ? error.message : "오류가 발생했습니다.",
      });
      setIsDeleting(false);
    }
  };

  const handleChatTitleClick = (submission: Submission) => {
    setSelectedChatTitle({
      id: submission.id,
      url: submission.filePath,
    });
    setChatTitleDialogOpen(true);
  };

  const refreshData = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">이미지 관리</h1>
        <p className="text-muted-foreground">
          총 {submissions.length}개의 이미지
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>이미지 목록</CardTitle>
          <CardDescription>
            업로드된 이미지 목록입니다. 이미지 수정 및 삭제가 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="이미지 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="killfeed">킬피드</SelectItem>
                <SelectItem value="chat">채팅 타이틀</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거절됨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이미지</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>유저 정보</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>크기</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>업로드 일시</TableHead>
                <TableHead>검토자</TableHead>
                <TableHead>검토 일시</TableHead>
                <TableHead>관리자 메모</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="relative w-20 h-20">
                      <Image
                        src={submission.filePath}
                        alt={submission.fileName}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {submission.type === "killfeed" ? "킬피드" : "채팅 칭호"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger className="flex items-center gap-1 cursor-help">
                        <span className="font-medium">
                          {submission.userNickname || "알 수 없음"}
                        </span>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">유저 정보</h4>
                          <div className="text-sm">
                            <p>
                              <span className="font-medium">닉네임:</span>{" "}
                              {submission.userNickname || "알 수 없음"}
                            </p>
                            <p>
                              <span className="font-medium">고유번호:</span>{" "}
                              {submission.userGameId}
                            </p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell>{submission.fileName}</TableCell>
                  <TableCell>{formatFileSize(submission.fileSize)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        submission.status === "approved"
                          ? "default"
                          : submission.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {submission.status === "approved"
                        ? "승인됨"
                        : submission.status === "rejected"
                        ? "거절됨"
                        : "대기중"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(submission.uploadedAt)}</TableCell>
                  <TableCell>
                    {submission.reviewerId ? (
                      <HoverCard>
                        <HoverCardTrigger className="flex items-center gap-1 cursor-help">
                          <span className="font-medium">
                            {submission.reviewerNickname || "알 수 없음"}
                          </span>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">
                              검토자 정보
                            </h4>
                            <div className="text-sm">
                              <p>
                                <span className="font-medium">닉네임:</span>{" "}
                                {submission.reviewerNickname || "알 수 없음"}
                              </p>
                              <p>
                                <span className="font-medium">고유번호:</span>{" "}
                                {submission.reviewerUserId}
                              </p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.reviewedAt
                      ? formatDate(submission.reviewedAt)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {submission.adminNotes ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Info className="h-4 w-4 mr-1" />
                            메모 보기
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>관리자 메모</DialogTitle>
                            <DialogDescription>
                              {formatDate(submission.reviewedAt!)}에 작성된
                              메모입니다.
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                            <p className="text-sm whitespace-pre-wrap">
                              {submission.adminNotes}
                            </p>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {submission.status === "pending" && (
                        <>
                          {submission.type === "chat" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleChatTitleClick(submission)}
                              className="w-full"
                            >
                              이미지 조절 및 승인
                            </Button>
                          ) : (
                            <ImageApprovalButton
                              imageId={submission.id}
                              type={submission.type}
                              onSuccess={refreshData}
                            />
                          )}
                        </>
                      )}
                      {submission.status !== "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setIsDeleting(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>이미지 수정</DialogTitle>
            <DialogDescription>
              이미지 정보를 수정하고 상태를 변경할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {selectedSubmission?.type === "chat" ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <ChatTitleExample
                    imageSrc={selectedSubmission?.filePath}
                    scale={editedScale / 100}
                    marginX={0}
                    marginY={-3}
                  />
                </div>
                {selectedSubmission.status === "pending" && (
                  <div className="space-y-2">
                    <Label>크기 조절 (70% ~ 100%)</Label>
                    <Slider
                      value={[editedScale]}
                      onValueChange={(value) => setEditedScale(value[0])}
                      min={70}
                      max={100}
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground text-right">
                      {editedScale}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={selectedSubmission?.filePath || ""}
                  alt={selectedSubmission?.fileName || ""}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <div className="space-y-4">
              {selectedSubmission?.status === "pending" && (
                <div className="space-y-2">
                  <Label>상태</Label>
                  <Select value={editedStatus} onValueChange={setEditedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기중</SelectItem>
                      <SelectItem value="approved">승인</SelectItem>
                      <SelectItem value="rejected">거절</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>관리자 메모</Label>
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="관리자 메모를 입력하세요."
                  className="h-32"
                  readOnly={selectedSubmission?.status !== "pending"}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleting(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              {selectedSubmission?.status === "pending" && (
                <Button onClick={handleSave}>저장</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 채팅 칭호 이미지 조절 대화상자 */}
      {selectedChatTitle && (
        <ChatTitleDialog
          open={chatTitleDialogOpen}
          onOpenChange={setChatTitleDialogOpen}
          imageUrl={selectedChatTitle.url}
          imageId={selectedChatTitle.id}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
}

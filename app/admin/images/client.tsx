"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Info, Trash2, ZoomIn, Search, MoreHorizontal } from "lucide-react";
import { deleteImage } from "@/actions/image-action";
import { Badge } from "@/components/ui/badge";
import { ImageApprovalButton } from "@/components/admin/image-approval-button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ChatTitleDialog from "@/components/admin/chat-title-dialog";
import AdminImageEditDialog from "@/components/admin/AdminImageEditDialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Metadata {
  width?: string;
  scale?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

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
  reason: string | null;
  userGameId: string | null;
  gameDbMetadata?: Metadata | null;
  name?: string;
  code?: string;
}

interface AdminImagesClientProps {
  submissions: Submission[];
  currentPage: number;
  totalPages: number;
  currentType: string;
  currentStatus: string;
  currentName?: string;
}

export default function AdminImagesClient({
  submissions,
  currentPage,
  totalPages,
  currentType,
  currentStatus,
  currentName = "",
}: AdminImagesClientProps) {
  // ... 기존 state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<null | { id: string; name: string; type: "killfeed" | "chat" }>(null);

  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [type, setType] = useState(currentType);
  const [status, setStatus] = useState(currentStatus);
  const [nameSearch, setNameSearch] = useState(currentName);
  const [chatTitleDialogOpen, setChatTitleDialogOpen] = useState(false);
  const [selectedChatTitleData, setSelectedChatTitleData] = useState<{
    id: string;
    url: string;
    metadata: Metadata;
    adminNotes?: string | null;
  } | null>(null);

  // 이미지 확대 다이얼로그
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<Submission | null>(null);

  const handleTypeChange = (value: string) => {
    setType(value);
    const searchParams = new URLSearchParams({
      type: value,
      status: status,
      page: "1",
      ...(nameSearch && { name: nameSearch }),
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    const searchParams = new URLSearchParams({
      type: type,
      status: value,
      page: "1",
      ...(nameSearch && { name: nameSearch }),
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handleNameSearch = () => {
    const searchParams = new URLSearchParams({
      type: type,
      status: status,
      page: "1",
      ...(nameSearch && { name: nameSearch }),
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams({
      type: type,
      status: status,
      page: String(page),
      ...(nameSearch && { name: nameSearch }),
    });
    router.push(`/admin/images?${searchParams.toString()}`);
  };

  const handleDelete = async () => {
    if (!selectedSubmission) return;

    try {
      setIsDeleting(true);
      const response = await deleteImage(
        Number(selectedSubmission.id)
      );

      if (!response) {
        throw new Error("이미지 삭제 실패");
      }

      toast.success("이미지가 완전히 삭제되었습니다.");

      setIsDeleting(false);
      setSelectedSubmission(null);
      setChatTitleDialogOpen(false);
      setSelectedChatTitleData(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "오류가 발생했습니다."
      );
      setIsDeleting(false);
    }
  };

  const handleChatTitleClick = (submission: Submission) => {
    setSelectedChatTitleData({
      id: submission.id,
      url: submission.filePath,
      metadata: submission.gameDbMetadata || {
        width: "100px",
        scale: 0.7,
        marginTop: -3,
        marginRight: -10,
        marginBottom: 0,
        marginLeft: -10,
      },
      adminNotes: submission.adminNotes,
    });
    setChatTitleDialogOpen(true);
  };

  const refreshData = () => {
    router.refresh();
  };

  // 서버에서 이미 필터링된 데이터를 그대로 사용
  const filteredData = submissions;

  // 승인/거절 핸들러
  const handleApproval = async (id: string, action: "approved" | "rejected") => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: id,
          status: action,
        }),
      });

      if (response.ok) {
        toast(action === "approved" ? "승인 완료" : "거절 완료");
        router.refresh();
      } else {
        const error = await response.json();
        toast(error.error || `${action === "approved" ? "승인" : "거절"} 중 오류가 발생했습니다.`);
      }
    } catch (error) {
      toast(`${action === "approved" ? "승인" : "거절"} 중 오류가 발생했습니다.`);
    } finally {
      setIsDeleting(false);
    }
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

            <div className="flex-1 flex gap-2">
              <Input
                placeholder="아이템 이름으로 검색..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameSearch();
                  }
                }}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleNameSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이미지</TableHead>
                <TableHead>아이템명</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>유저 정보</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>메모/사유</TableHead>
                <TableHead>검토자</TableHead>
                <TableHead>검토 일시</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="relative w-20 h-20 cursor-pointer group" onClick={() => { setZoomImage(submission); setImageDialogOpen(true); }}>
                      <Image
                        src={submission.filePath}
                        alt={submission.fileName}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                        unoptimized
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity rounded">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {submission.name || "이름 없음"}
                    </span>
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
                              <span className="font-medium">게임 ID:</span>{" "}
                              {submission.userGameId || "-"}
                            </p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
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
                  <TableCell>
                    {submission.reason ? (
                      <div className="max-w-[100px] truncate text-sm" title={submission.reason}>
                        {submission.reason.length > 8 
                          ? `${submission.reason.substring(0, 8)}...`
                          : submission.reason
                        }
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
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
                                <span className="font-medium">게임 ID:</span>{" "}
                                {submission.reviewerUserId || "-"}
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
                    {/* Action Dropdown */}
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
  <DropdownMenuItem
    onClick={() => {
      setEditTarget({
        id: submission.id,
        name: submission.name || submission.fileName,
        type: submission.type,
      });
      setEditDialogOpen(true);
    }}
  >
    이미지 수정
  </DropdownMenuItem>
                            {submission.type === "chat" ? (
                              <DropdownMenuItem
                                onClick={() => handleChatTitleClick(submission)}
                              >
                                {submission.status === "pending"
                                  ? "조정 및 승인/거절"
                                  : "메타데이터 수정"}
                              </DropdownMenuItem>
                            ) : (
                              submission.status === "pending" && (
                                <DropdownMenuItem asChild>
                                  <ImageApprovalButton
                                    imageId={submission.id}
                                    type={submission.type}
                                    onSuccess={refreshData}
                                  />
                                </DropdownMenuItem>
                              )
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsDeleting(true);
                              }}
                            >
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* 삭제 확인 다이얼로그 */}
                        <Dialog
                          open={
                            selectedSubmission?.id === submission.id && isDeleting
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedSubmission(null);
                              setIsDeleting(false);
                            }
                          }}
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>이미지 삭제</DialogTitle>
                              <DialogDescription>
                                정말로 이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedSubmission(null);
                                  setIsDeleting(false);
                                }}
                              >
                                취소
                              </Button>
                              <Button variant="destructive" onClick={handleDelete}>
                                삭제
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
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
                    size="icon"
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

      {/* 이미지 확대 다이얼로그 */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>이미지 상세 보기</DialogTitle>
          </DialogHeader>
          {zoomImage && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-[320px] h-[120px] border rounded-lg overflow-hidden bg-background">
                <Image
                  src={zoomImage.filePath}
                  alt={zoomImage.fileName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="w-full space-y-2">
                <div className="font-semibold text-lg">{zoomImage.name || zoomImage.fileName}</div>
                <div className="text-sm text-muted-foreground">ID: {zoomImage.id}</div>
                <div className="text-sm text-muted-foreground">Code: {zoomImage.code || "-"}</div>
                <div className="text-sm mt-2">
                  <span className="font-medium">메타데이터</span>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {zoomImage.gameDbMetadata ? (
                      <>
                        {zoomImage.gameDbMetadata.width && (
                          <li>width: {zoomImage.gameDbMetadata.width}</li>
                        )}
                        {zoomImage.gameDbMetadata.scale !== undefined && (
                          <li>scale: {zoomImage.gameDbMetadata.scale}</li>
                        )}
                        {zoomImage.gameDbMetadata.marginTop !== undefined && (
                          <li>marginTop: {zoomImage.gameDbMetadata.marginTop}</li>
                        )}
                        {zoomImage.gameDbMetadata.marginRight !== undefined && (
                          <li>marginRight: {zoomImage.gameDbMetadata.marginRight}</li>
                        )}
                        {zoomImage.gameDbMetadata.marginBottom !== undefined && (
                          <li>marginBottom: {zoomImage.gameDbMetadata.marginBottom}</li>
                        )}
                        {zoomImage.gameDbMetadata.marginLeft !== undefined && (
                          <li>marginLeft: {zoomImage.gameDbMetadata.marginLeft}</li>
                        )}
                      </>
                    ) : (
                      <li>메타데이터 없음</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 채팅 칭호 다이얼로그 */}
      {selectedChatTitleData && (
        <ChatTitleDialog
          open={chatTitleDialogOpen}
          onOpenChange={setChatTitleDialogOpen}
          imageUrl={selectedChatTitleData.url}
          imageId={selectedChatTitleData.id}
          initialMetadata={selectedChatTitleData.metadata}
          initialAdminNotes={selectedChatTitleData.adminNotes}
          onSuccess={refreshData}
        />
      )}
    {/* 이미지 수정 다이얼로그 */}
    {editTarget && (
      <AdminImageEditDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditTarget(null);
        }}
        imageId={Number(editTarget.id)}
        initialName={editTarget.name}
        type={editTarget.type}
        onSuccess={refreshData}
      />
    )}
  </div>
  );
}

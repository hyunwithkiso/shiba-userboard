"use client";

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Shield, ShieldAlert, Trash2, ArrowUpDown, Edit, MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { makeAdminAction, removeAdminAction } from "@/actions/user-action";
import { updateUserIdAction } from "@/actions/user-action";

interface AdminUsersPageProps {
  userList: Array<{
    id: string;
    name: string | null;
    email: string | null;
    discordId: string | null;
    userId: string | null;
    nickname: string | null;
    isAdmin: boolean | null;
    createdAt: Date;
  }>;
  isAdmin: boolean;
  currentUserUserId?: string | null;
  currentUserDiscordId?: string | null;
  page: number;
  pageSize: number;
  totalCount: number;
  initialFilter?: string;
  initialSearch?: string;
  initialSort?: string;
  initialOrder?: "asc" | "desc";
}

export default function AdminUsersClient({ userList, isAdmin, currentUserUserId, currentUserDiscordId, page, pageSize, totalCount, initialFilter = "", initialSearch = "", initialSort = "userId", initialOrder = "asc" }: AdminUsersPageProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState<"asc" | "desc">(initialOrder);

  // URL로부터 넘어온 초기값 변경 시 동기화
  useEffect(() => {
    setSearch(initialSearch);
    setFilter(initialFilter);
    setSort(initialSort);
    setOrder(initialOrder);
  }, [initialSearch, initialFilter, initialSort, initialOrder]);
  
  // 고유번호 변경용 상태
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [isUserIdDialogOpen, setIsUserIdDialogOpen] = useState(false);
  // 동기화 프리뷰용 상태
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncPreview, setSyncPreview] = useState<any | null>(null);

  // 슈퍼 마스터 권한 체크: userId 또는 discordId가 "1" 또는 "2"
  const isSuperMaster =
    currentUserUserId === "1" ||
    currentUserUserId === "2" ||
    currentUserDiscordId === "1" ||
    currentUserDiscordId === "2";
  // 동기화 권한: 관리자라면 허용
  const canSync = isAdmin || isSuperMaster;

  // 동기화 프리뷰: 변경 예정 항목만 확인
  const handleSyncPreview = async () => {
    try {
      setIsProcessing(true);
      console.log("[SyncPreview] 변경 예정 항목 조회 시작");
      const res = await fetch("/api/admin/users/sync-user-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: false }),
      });
      const json = await res.json();
      console.log("[SyncPreview] 결과", json);
      if (res.ok) {
        setSyncPreview(json);
        setIsSyncDialogOpen(true);
      } else {
        toast.error(json?.error || "프리뷰 조회 실패");
      }
    } catch (error) {
      console.error("[SyncPreview] 오류", error);
      toast.error("프리뷰 조회 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 동기화 적용: 200건 단위 배치 업데이트
  const handleSyncApply = async () => {
    try {
      setIsProcessing(true);
      console.log("[SyncApply] 동기화 적용 시작 (200/배치)");
      const res = await fetch("/api/admin/users/sync-user-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: true, limit: 200 }),
      });
      const json = await res.json();
      console.log("[SyncApply] 적용 결과", json);
      if (res.ok) {
        toast.success(`적용 완료 ${json?.counts?.updated ?? 0}건`);
        setIsSyncDialogOpen(false);
        setSyncPreview(null);
        router.refresh();
      } else {
        toast.error(json?.error || "적용 실패");
      }
    } catch (error) {
      console.error("[SyncApply] 오류", error);
      toast.error("동기화 적용 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 중복 제거된 유저 목록 (클라이언트 사이드에서도 안전장치)
  const uniqueUserList = userList.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  );

  // 서버에서 필터/정렬을 처리하므로 클라이언트에서는 그대로 출력
  const sortedUsers = uniqueUserList;

  const handleSort = (column: string) => {
    let nextOrder: "asc" | "desc" = "asc";
    if (column === sort) {
      nextOrder = order === "asc" ? "desc" : "asc";
    }
    setSort(column);
    setOrder(nextOrder);
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (search) params.set("q", search);
    params.set("sort", column);
    params.set("order", nextOrder);
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  // 페이지네이션 관련 계산 및 이동
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (filter) params.set("filter", filter);
    if (search) params.set("q", search);
    if (sort) params.set("sort", sort);
    if (order) params.set("order", order);
    return `/admin/users?${params.toString()}`;
  };

  // 표시할 페이지 번호 계산 (최대 7개 + 양쪽 Ellipsis)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    // 항상 첫 페이지 표시
    pages.push(1);
    // 앞쪽 구간
    if (page <= 4) {
      pages.push(2, 3, 4, 5);
      pages.push("ellipsis");
    } else {
      pages.push("ellipsis");
      pages.push(page - 1, page, page + 1);
      // 중간 구간에서 범위 벗어나면 정리
      pages[pages.length - 1] = Math.min(pages[pages.length - 1] as number, totalPages - 1);
    }
    // 뒤쪽 구간
    if (page >= totalPages - 3) {
      // 뒤쪽 근접: 마지막 4개 표시
      pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      pages.push("ellipsis");
    }
    // 마지막 페이지 표시
    pages.push(totalPages);
    // 중복 및 범위 정리
    const normalized: (number | "ellipsis")[] = [];
    let lastAdded: number | "ellipsis" | null = null;
    for (const p of pages) {
      if (p === "ellipsis") {
        if (lastAdded !== "ellipsis") normalized.push("ellipsis");
        lastAdded = "ellipsis";
      } else {
        const num = Math.max(1, Math.min(totalPages, p));
        if (lastAdded !== num) normalized.push(num);
        lastAdded = num;
      }
    }
    return normalized.filter((v, i, arr) => {
      if (v === "ellipsis") return true;
      // 제거: 첫/마지막이 중복되거나 역순 생성된 값
      return arr.indexOf(v) === i;
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const pushSearch = () => {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (search) params.set("q", search);
    if (sort) params.set("sort", sort);
    if (order) params.set("order", order);
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  // 고유번호 변경 다이얼로그 열기
  const openUserIdDialog = (user: { id: string; userId: string | null; nickname: string | null; name: string | null }) => {
    setEditingUserId(user.id);
    setNewUserId(user.userId || "");
    setIsUserIdDialogOpen(true);
  };

  // 고유번호 변경 처리
  const handleUpdateUserId = async () => {
    if (!editingUserId || !newUserId.trim()) {
      toast.error("고유번호를 입력해주세요.");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await updateUserIdAction(editingUserId, newUserId.trim());

      if (result.success) {
        toast.success("고유번호가 성공적으로 변경되었습니다.");
        setIsUserIdDialogOpen(false);
        setEditingUserId(null);
        setNewUserId("");
        router.refresh();
      } else {
        toast.error(result.error || "고유번호 변경에 실패했습니다.");
      }
    } catch (error) {
      toast.error("고유번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeAdmin = async (userId: string, userName: string) => {
    try {
      setIsProcessing(true);
      const result = await makeAdminAction(userId);

      if (result.success) {
        toast.success(`${userName}님에게 어드민 권한이 부여되었습니다.`);
        router.refresh();
      } else {
        toast.error(result.error || "어드민 권한 부여에 실패했습니다.");
      }
    } catch (error) {
      toast.error("어드민 권한 부여 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, userName: string) => {
    try {
      setIsProcessing(true);
      const result = await removeAdminAction(userId);

      if (result.success) {
        toast.success(`${userName}님의 어드민 권한이 제거되었습니다.`);
        router.refresh();
      } else {
        toast.error(result.error || "어드민 권한 제거에 실패했습니다.");
      }
    } catch (error) {
      toast.error("어드민 권한 제거 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("유저 삭제에 실패했습니다.");
      }

      toast.success(`${userName}님의 계정이 삭제되었습니다.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-8xl py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">유저 관리</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">총 {totalCount}명의 유저</p>
          {canSync && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSyncPreview} disabled={isProcessing}>
                동기화 프리뷰
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>유저 목록</CardTitle>
          <CardDescription>
            전체 유저 목록입니다. 어드민 권한 부여 및 계정 삭제가 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select
              value={filter}
              onValueChange={(v) => {
                setFilter(v);
                const params = new URLSearchParams();
                if (v) params.set("filter", v);
                if (search) params.set("q", search);
                if (sort) params.set("sort", sort);
                if (order) params.set("order", order);
                params.set("page", "1");
                router.push(`/admin/users?${params.toString()}`);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="필터 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="userId">게임 ID</SelectItem>
                <SelectItem value="email">이메일</SelectItem>
                <SelectItem value="nickname">닉네임</SelectItem>
                <SelectItem value="discordId">디스코드 ID</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="검색어를 입력하세요"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") pushSearch();
                }}
              />
              <Button variant="outline" onClick={pushSearch}>
                검색
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("discordId")}
                    className="flex items-center gap-1"
                  >
                    디스코드 ID
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("userId")}
                    className="flex items-center gap-1"
                  >
                    게임 ID
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("nickname")}
                    className="flex items-center gap-1"
                  >
                    닉네임
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("email")}
                    className="flex items-center gap-1"
                  >
                    이메일
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">어드민</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.discordId || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{user.userId || "-"}</span>
                      {isSuperMaster && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="고유번호 편집"
                          onClick={() => openUserIdDialog(user)}
                          disabled={isProcessing}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.nickname || user.name || "-"}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell className="text-center">
                    {user.isAdmin ? (
                      <ShieldAlert className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {isSuperMaster && user.userId !== "1" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isProcessing}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  어드민 권한 부여
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    어드민 권한 부여
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {user.nickname || user.name}님에게 어드민
                                    권한을 부여하시겠습니까?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleMakeAdmin(
                                        user.id,
                                        user.nickname || user.name || "알 수 없음"
                                      )
                                    }
                                  >
                                    권한 부여
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {user.isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <ShieldAlert className="mr-2 h-4 w-4 text-orange-500" />
                                  어드민 권한 제거
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    어드민 권한 제거
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {user.nickname || user.name}님의 어드민
                                    권한을 제거하시겠습니까?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-orange-500 hover:bg-orange-600"
                                    onClick={() =>
                                      handleRemoveAdmin(
                                        user.id,
                                        user.nickname || user.name || "알 수 없음"
                                      )
                                    }
                                  >
                                    권한 제거
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {(user.isAdmin || !user.isAdmin) && (
                            <>
                              {user.isAdmin && <DropdownMenuSeparator />}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                    유저 삭제
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>유저 삭제</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {user.nickname || user.name}님의 계정을
                                      삭제하시겠습니까? 이 작업은 되돌릴 수 없으며,
                                      모든 데이터가 삭제됩니다.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-500 hover:bg-red-600"
                                      onClick={() =>
                                        handleDeleteUser(
                                          user.id,
                                          user.nickname || user.name || "알 수 없음"
                                        )
                                      }
                                    >
                                      삭제
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* 번호형 페이지네이션 */}
          <div className="pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={canPrev ? pageHref(page - 1) : undefined}
                    className={!canPrev ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                {getPageNumbers().map((p, idx) => (
                  p === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`page-${p}`}>
                      <PaginationLink
                        href={pageHref(p)}
                        isActive={p === page}
                        size="default"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                ))}
                <PaginationItem>
                  <PaginationNext
                    href={canNext ? pageHref(page + 1) : undefined}
                    className={!canNext ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              총 {totalCount}명 • 페이지 {page} / {totalPages} • 페이지당 {pageSize}명
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 동기화 프리뷰 다이얼로그 */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-[min(92vw,56rem)] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>고유번호 동기화 프리뷰</DialogTitle>
            <DialogDescription>
              VRP 매핑과 사이트 계정을 비교하여 변경 예정 목록을 요약합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">
              예정 변경: {syncPreview?.counts?.willUpdate ?? 0}건 • 배치 적용 크기: {syncPreview?.counts?.batchSize ?? 0}건
            </div>
            <div className="max-h-[50vh] overflow-auto border rounded p-2 text-sm">
              {(syncPreview?.changes ?? []).slice(0, 20).map((c: any) => (
                <div key={`${c.siteUid}-${c.discordId}`} className="flex gap-2 justify-between py-1">
                  <span className="w-40 truncate">Discord: {c.discordId}</span>
                  <span className="w-56 truncate">사용자: {c.email || c.nickname || c.name || c.siteUid}</span>
                  <span className="w-40 text-right">{c.currentUserId ?? "-"} → {c.newUserId}</span>
                </div>
              ))}
              {((syncPreview?.changes ?? []).length || 0) > 20 && (
                <div className="text-xs text-muted-foreground mt-2">상위 20건만 표시합니다.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)} disabled={isProcessing}>
              취소
            </Button>
            <Button onClick={handleSyncApply} disabled={isProcessing}>
              {isProcessing ? "적용 중..." : "적용(200/배치)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 고유번호 변경 다이얼로그 */}
      <Dialog open={isUserIdDialogOpen} onOpenChange={setIsUserIdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>고유번호 변경</DialogTitle>
            <DialogDescription>
              사용자의 고유번호를 변경합니다. 숫자만 입력 가능합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-userid">새로운 고유번호</Label>
              <Input
                id="new-userid"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="고유번호 입력 (숫자만)"
                pattern="[0-9]*"
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUserIdDialogOpen(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button onClick={handleUpdateUserId} disabled={isProcessing}>
              {isProcessing ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

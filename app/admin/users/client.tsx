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
import { useState } from "react";
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
  currentUserUserId?: string | null;
}

export default function AdminUsersClient({ userList, currentUserUserId }: AdminUsersPageProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("userId");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  
  // 고유번호 변경용 상태
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [isUserIdDialogOpen, setIsUserIdDialogOpen] = useState(false);

  // 마스터 권한 체크 (userId가 "1"인 사용자만)
  const isMaster = currentUserUserId === "1";

  // 중복 제거된 유저 목록 (클라이언트 사이드에서도 안전장치)
  const uniqueUserList = userList.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  );

  // 필터링된 유저 목록
  const filteredUsers = uniqueUserList.filter((user) => {
    if (!search || !filter) return true;

    const searchLower = search.toLowerCase();
    const value = user[filter as keyof typeof user];

    if (!value) return false;
    return String(value).toLowerCase().includes(searchLower);
  });

  // 정렬된 유저 목록
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sort as keyof typeof a];
    const bValue = b[sort as keyof typeof b];

    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;

    const comparison = String(aValue).localeCompare(String(bValue));
    return order === "asc" ? comparison : -comparison;
  });

  const handleSort = (column: string) => {
    if (column === sort) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(column);
      setOrder("asc");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
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
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">유저 관리</h1>
        <p className="text-muted-foreground">총 {uniqueUserList.length}명의 유저</p>
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
            <Select value={filter} onValueChange={setFilter}>
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
              />
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
                      {isMaster && (
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
                      {isMaster && user.userId !== "1" && (
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
        </CardContent>
      </Card>

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

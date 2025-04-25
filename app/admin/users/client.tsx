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
import { Shield, ShieldAlert, Trash2, ArrowUpDown } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
}

export default function AdminUsersClient({ userList }: AdminUsersPageProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("userId");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // 필터링된 유저 목록
  const filteredUsers = userList.filter((user) => {
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

  const handleMakeAdmin = async (userId: string, userName: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/admin/users/make-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("어드민 권한 부여에 실패했습니다.");
      }

      toast({
        title: "어드민 권한 부여 완료",
        description: `${userName}님에게 어드민 권한이 부여되었습니다.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류 발생",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      });
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

      toast({
        title: "유저 삭제 완료",
        description: `${userName}님의 계정이 삭제되었습니다.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류 발생",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">유저 관리</h1>
        <p className="text-muted-foreground">총 {userList.length}명의 유저</p>
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
                  <TableCell>{user.userId || "-"}</TableCell>
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
                    <div className="flex justify-center gap-2">
                      {!user.isAdmin && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="어드민으로 전환"
                                disabled={isProcessing}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  어드민 권한 부여
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.nickname || user.name}님에게 어드민
                                  권한을 부여하시겠습니까? 이 작업은 되돌릴 수
                                  없습니다.
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

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-500"
                                title="유저 삭제"
                                disabled={isProcessing}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

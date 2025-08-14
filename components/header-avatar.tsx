"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Users, User, Image as ImageIcon, LogOut } from "lucide-react";
import { getCurrentUserInfo } from "@/actions/user-action";

export default function HeaderAvatar() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState({
    isAdmin: false,
    hasUserId: false,
    userId: null as string | null,
    nickname: null as string | null,
    email: null as string | null,
    name: null as string | null,
    image: null as string | null,
  });

  // 실시간 사용자 데이터 조회
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const fetchUserData = async () => {
        try {
          const result = await getCurrentUserInfo();
          if (result && result.success && result.user) {
            setUserData({
              isAdmin: result.user.isAdmin,
              hasUserId: !!result.user.userId,
              userId: result.user.userId,
              nickname: result.user.nickname,
              email: result.user.email,
              name: result.user.name,
              image: result.user.image,
            });
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };
      fetchUserData();
    }
  }, [status, session]);

  if (!session?.user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={userData.image || session.user.image || ""}
              alt={userData.name || session.user.name || ""}
            />
            <AvatarFallback>
              {(userData.nickname || userData.name || session.user.name)?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userData.nickname || "연동 필요"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email || "연동 필요"}
            </p>
            {userData.userId && (
              <p className="text-xs leading-none text-muted-foreground">
                고유번호: {userData.userId}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>ㄴ
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>내 프로필</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {userData.isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin/users" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>유저 관리</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/images" className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>이미지 관리</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

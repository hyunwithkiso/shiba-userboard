"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/ui/logo";
import {
  Menu,
  LogOut,
  UploadCloud,
  History,
  User,
  ShoppingCart,
  Settings,
  ImageIcon,
} from "lucide-react";
import { MiniCart } from "../cart/mini-cart";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCurrentUserInfo } from "@/actions/user-action";

const navLinks = [
  { href: "/notices", label: "공지사항" },
  { href: "/events", label: "이벤트" },
  { href: "/gallery", label: "갤러리" },
  { href: "/killfeed", label: "킬피드 업로드" },
  { href: "/chat-title", label: "채팅 칭호 업로드" },
  { href: "/exchange", label: "거래소" },
  { href: "/shop", label: "상점" },
  { href: "/image-tools", label: "이미지 압축" },
];

// 보호된 라우트들
const protectedRoutes = ["/killfeed", "/chat-title", "/exchange", "/shop", "/image-tools"];

// 보호된 링크 컴포넌트
function ProtectedLink({ 
  href, 
  children, 
  className, 
  onClick 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (protectedRoutes.includes(href)) {
      try {
        const response = await fetch("/api/user/check-userid");
        const result = await response.json();

        if (!result.success || !result.hasUserId) {
          toast.error("인증되지 않은 계정입니다.");
          return;
        }

        // userId가 있으면 정상적으로 이동
        router.push(href);
      } catch (error) {
        console.error("userId 검사 실패:", error);
        toast.error("인증 확인 중 오류가 발생했습니다.");
        return;
      }
    } else {
      // 보호되지 않은 라우트는 바로 이동
      router.push(href);
    }

    // onClick 콜백 실행 (모바일 메뉴 닫기 등)
    if (onClick) {
      onClick();
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

function SignOutButton() {
  return (
    <form
      action={async () => {
        await signOut({ callbackUrl: "/login" });
      }}
      className="w-full"
    >
      <button type="submit" className="w-full text-left">
        <DropdownMenuItem className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </button>
    </form>
  );
}

export const Header = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    if (isAuthenticated && session?.user) {
      const fetchUserData = async () => {
        try {
          const result = await getCurrentUserInfo();
          if (result.success && result.user) {
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
    } else {
      setUserData({
        isAdmin: false,
        hasUserId: false,
        userId: null,
        nickname: null,
        email: null,
        name: null,
        image: null,
      });
    }
  }, [isAuthenticated]);

  const filteredNavLinks = navLinks.filter((link) => {
    // 거래소는 관리자만 접근 가능
    if (link.href === "/exchange") {
      return userData.isAdmin;
    }
    
    // 다른 보호된 라우트들은 기존 로직 유지
    const isProtected = protectedRoutes.includes(link.href);
    const hasAccess = userData.hasUserId || userData.isAdmin;
    return !isProtected || hasAccess;
  });

  return (
    <header className="fixed top-0 z-50 w-full bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/20 pr-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="container flex h-18 items-center mx-auto">
        <Link
          href="/"
          className="flex items-center space-x-2"
          aria-label="SHIBA 유저보드 홈"
        >
          <Logo className="w-16 h-16" />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {filteredNavLinks.map((link) => (
              <ProtectedLink
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-foreground/80 transition-colors font-semibold"
              >
                {link.label}
              </ProtectedLink>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center space-x-4">
              {status === "authenticated" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar
                      className="h-8 w-8 cursor-pointer"
                      aria-label="사용자 메뉴 열기"
                      tabIndex={0}
                    >
                      <AvatarImage
                        src={userData.image || session.user?.image || undefined}
                        alt={userData.nickname || userData.name || "사용자 프로필"}
                      />
                      <AvatarFallback>
                        {(userData.nickname || userData.name || session.user?.name)?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userData.nickname || userData.name || session.user?.name || "사용자"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userData.email || session.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <div className="text-xs text-muted-foreground ml-1">
                      {userData.userId && `고유번호 : ${userData.userId}`}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>내 프로필</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-uploads">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        <span>내 업로드 현황</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/purchases">
                        <History className="mr-2 h-4 w-4" />
                        <span>구매 내역</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cart">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>장바구니</span>
                      </Link>
                    </DropdownMenuItem>
                    {userData.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>유저 관리</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/gallery">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            <span>갤러리 관리</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/images">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            <span>이미지 관리</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <SignOutButton />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : status === "loading" ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-foreground hover:text-foreground/80 transition-colors font-semibold"
                >
                  로그인
                </Link>
              )}
            </div>
            <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="메뉴 열기">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium mt-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    aria-label="SHIBA 유저보드 홈"
                  >
                    <Logo className="w-12 h-12" />
                  </Link>
                  {filteredNavLinks.map((link) => (
                    <ProtectedLink
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </ProtectedLink>
                  ))}
                  <div className="mt-auto pt-6 border-t">
                    {status === "authenticated" ? (
                      <div className="space-y-4">
                        <SheetClose asChild>
                          <Link
                            href="/profile"
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <User className="h-5 w-5" /> 내 프로필
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/my-uploads"
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <UploadCloud className="h-5 w-5" /> 내 업로드 현황
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/purchases"
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <History className="h-5 w-5" /> 구매 내역
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/cart"
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <ShoppingCart className="h-5 w-5" /> 장바구니
                          </Link>
                        </SheetClose>
                        {userData.isAdmin && (
                          <>
                            <SheetClose asChild>
                              <Link
                                href="/admin/users"
                                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                              >
                                <Settings className="h-5 w-5" /> 유저 관리
                              </Link>
                            </SheetClose>
                            <SheetClose asChild>
                              <Link
                                href="/admin/gallery"
                                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                              >
                                <ImageIcon className="h-5 w-5" /> 갤러리 관리
                              </Link>
                            </SheetClose>
                            <SheetClose asChild>
                              <Link
                                href="/admin/images"
                                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                              >
                                <ImageIcon className="h-5 w-5" /> 이미지 관리
                              </Link>
                            </SheetClose>
                          </>
                        )}
                        <form
                          action={async () => {
                            await signOut({ callbackUrl: "/login" });
                          }}
                        >
                          <button
                            type="submit"
                            className="w-full flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <LogOut className="h-5 w-5" /> 로그아웃
                          </button>
                        </form>
                      </div>
                    ) : (
                      status !== "loading" && (
                        <SheetClose asChild>
                          <Link href="/login" className="w-full">
                            <Button
                              variant="outline"
                              className="w-full justify-start font-semibold"
                            >
                              로그인
                            </Button>
                          </Link>
                        </SheetClose>
                      )
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
};

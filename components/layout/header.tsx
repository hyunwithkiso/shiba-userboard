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
import { ThemeToggle } from "../ui/theme-toggle";
import { MiniCart } from "../cart/mini-cart";

const navLinks = [
  { href: "/notices", label: "공지사항" },
  { href: "/killfeed", label: "킬피드 업로드" },
  { href: "/chat-title", label: "칭호 업로드" },
  { href: "/events", label: "이벤트" },
  { href: "/shop", label: "상점" },
];

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
  const isAdmin = session?.user?.isAdmin ?? false;
  const isAuthenticated = status === "authenticated";
  const hasUserId = !!session?.user?.userId;

  const filteredNavLinks = navLinks.filter((link) => {
    const protectedRoutes = ["/killfeed", "/chat-title", "/shop"];
    if (protectedRoutes.includes(link.href)) {
      return isAuthenticated && (isAdmin || hasUserId);
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto">
        <Link
          href="/"
          className="flex items-center space-x-2 mr-6"
          aria-label="SHIBA 유저보드 홈"
        >
          <Logo />
          <span className="font-bold">SHIBA 유저보드</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <ThemeToggle />
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
                      src={session.user?.image || undefined}
                      alt={session.user?.nickname || "사용자 프로필"}
                    />
                    <AvatarFallback>
                      {session.user?.nickname?.charAt(0)?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.nickname || ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <div className="text-xs text-muted-foreground ml-1">
                    고유번호 : {session.user?.userId}
                  </div>
                  <DropdownMenuSeparator />
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
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>유저 관리</span>
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
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                로그인
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <Sheet>
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
                    <Logo />
                    <span>SHIBA 유저보드</span>
                  </Link>
                  {filteredNavLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="mt-auto pt-6 border-t">
                    {status === "authenticated" ? (
                      <div className="space-y-4">
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
                        {isAdmin && (
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
                              className="w-full justify-start"
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
    </header>
  );
};

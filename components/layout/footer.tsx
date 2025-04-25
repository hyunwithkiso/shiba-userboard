import Link from "next/link";
import { Logo } from "@/components/ui/logo"; // 로고 컴포넌트 사용

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  // 푸터 링크 정의 (프로젝트에 맞게 수정)
  const quickLinks = [
    { href: "/notices", label: "공지사항" },
    { href: "/killfeed", label: "킬피드 업로드" },
    { href: "/chat-title", label: "칭호 업로드" },
    { href: "/events", label: "이벤트" },
    { href: "/shop", label: "상점" },
  ];

  const infoLinks = [
    { href: "/terms", label: "이용약관" }, // 약관 페이지 필요
    { href: "/privacy", label: "개인정보처리방침" }, // 개인정보처리방침 페이지 필요
  ];

  const socialLinks = [
    // Discord 링크는 환경변수나 고정값 사용
    {
      href: "https://discord.gg/shibarp",
      label: "Discord",
    },
  ];

  return (
    <footer className="border-t">
      <div className="container mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: 로고 및 설명 */}
          <div className="space-y-4">
            <Link
              href="/"
              className="flex items-center space-x-2"
              aria-label="SHIBA 유저보드 홈"
            >
              <Logo />
              <span className="font-bold text-lg">SHIBA 유저보드</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              현실적인 경제 시스템, 창의적인 컨텐츠, 그리고 커뮤니티 중심의
              환경을 제공하는 게임 플랫폼입니다.
            </p>
          </div>

          {/* Column 2: 바로가기 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
              바로가기
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: 정보 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
              정보
            </h3>
            <ul className="space-y-2">
              {infoLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: 소셜 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
              소셜
            </h3>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} SHIBA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

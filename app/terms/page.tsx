import fs from "fs";
import path from "path";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import MarkdownIt from "markdown-it";

export const metadata: Metadata = {
  title: "이용약관 | SHIBA 유저보드",
  description: "SHIBA 유저보드 이용약관입니다.",
};

export default function TermsPage() {
  // 서버 사이드에서 마크다운 파일 읽기
  const filePath = path.join(process.cwd(), "static", "term.md");
  const fileContent = fs.readFileSync(filePath, "utf8");

  // markdown-it 인스턴스 생성 및 HTML로 변환
  const md = new MarkdownIt();
  const contentHtml = md.render(fileContent);

  return (
    <main className="flex-1 py-24 md:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          홈으로 돌아가기
        </Link>

        <h1 className="text-3xl font-bold mb-8">이용약관</h1>
        <div className="p-6 bg-card rounded-lg shadow-sm">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </main>
  );
}

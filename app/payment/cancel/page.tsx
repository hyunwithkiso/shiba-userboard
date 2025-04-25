import Link from "next/link";
import { Suspense } from "react";
import { ResetBasketButton } from "@/components/reset-basket-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShoppingCart, Home } from "lucide-react";
import { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "결제 취소",
  description: "결제가 취소되거나 실패했습니다.",
};

function ResetButtonFallback() {
  return <Skeleton className="h-10 w-full max-w-xs" />;
}

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
          <CardTitle>결제 취소</CardTitle>
          <CardDescription>
            결제 과정이 완료되지 않았거나 취소되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert
            variant="default"
            className="border-orange-500 text-orange-700"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>결제 미완료</AlertTitle>
            <AlertDescription>
              장바구니에 담긴 상품은 그대로 유지됩니다. 다시 시도하거나
              장바구니를 비울 수 있습니다.
            </AlertDescription>
          </Alert>
          <div className="mt-6 space-y-4">
            <Suspense fallback={<ResetButtonFallback />}>
              <ResetBasketButton className="w-full" />
            </Suspense>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/cart">
                  <ShoppingCart className="mr-2 h-4 w-4" /> 장바구니로 이동
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" /> 홈으로 이동
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

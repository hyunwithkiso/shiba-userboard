"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { useToast } from "@/components/ui/use-toast"; // 나중에 피드백 추가 시 사용
// import { addProductToCartAction } from '@/actions/cart-actions'; // 서버 액션 임포트 (추후)

interface AddToCartFormProps {
  packageId: number;
}

const AddToCartForm = ({ packageId }: AddToCartFormProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // const { toast } = useToast(); // 토스트 훅

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    // 유효한 숫자이고 1 이상일 때만 업데이트
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };

  // 폼 제출 또는 버튼 클릭 시 실행될 함수
  const handleAddToCart = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 기본 폼 제출 방지
    setIsLoading(true);
    console.log(
      `Adding package ${packageId} to cart with quantity ${quantity}`
    );

    try {
      // TODO: 실제 장바구니 추가 로직 구현 (예: 서버 액션 호출)
      // const result = await addProductToCartAction(packageId, quantity);
      // if (result.success) {
      //   toast({ title: "성공", description: "장바구니에 상품을 추가했습니다." });
      // } else {
      //   toast({ variant: "destructive", title: "오류", description: result.error || "상품 추가 중 오류 발생" });
      // }
      // 임시 성공 토스트 (테스트용)
      // toast({ title: "알림", description: `상품 ID ${packageId} (${quantity}개) 장바구니 추가 시도` });
      alert(`상품 ID ${packageId} (${quantity}개) 장바구니 추가 시도 (임시)`); // 임시 alert
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      // toast({ variant: "destructive", title: "오류", description: "상품을 추가하는 중 예기치 않은 오류가 발생했습니다." });
      alert("상품 추가 중 오류 발생 (임시)"); // 임시 alert
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddToCart} className="space-y-4 pt-4">
      <div className="flex items-center space-x-3">
        <label
          htmlFor={`quantity-${packageId}`}
          className="text-sm font-medium text-foreground flex-shrink-0"
        >
          수량:
        </label>
        <Input
          id={`quantity-${packageId}`}
          name="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={handleQuantityChange}
          className="w-24 h-10"
          aria-label="구매 수량"
          required
          disabled={isLoading}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "추가 중..." : "장바구니에 추가"}
      </Button>
    </form>
  );
};

export default AddToCartForm;

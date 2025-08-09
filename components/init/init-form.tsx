"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateUserMetadataAction } from "@/actions/discord-action";

type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

interface InitFormProps {
  discordProfile: {
    roles: DiscordRole[];
    nickname: string;
    avatar?: string;
    username?: string;
    discriminator?: string;
  };
  gameId: number | string | null;
}

export default function InitForm({ discordProfile, gameId }: InitFormProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 색상 코드 변환 함수
  const getColorCode = (colorInt: number) => {
    if (colorInt === 0) return "#99AAB5"; // 기본 색상
    return `#${colorInt.toString(16).padStart(6, "0")}`;
  };

  const handleInitialize = async () => {
    if (!session?.user?.id) {
      setError("사용자 세션을 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }
    const userId = session.user.id;

    // gameId가 없으면 초기화 불가
    if (gameId === null) {
      setError("지정된 Discord 서버의 멤버가 아닙니다, 관리자에게 문의해주세요");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 사용자 메타데이터 업데이트
      const updateResult = await updateUserMetadataAction(
        userId,
        discordProfile.nickname,
        discordProfile.roles,
        gameId
      );
      if (!updateResult?.success) {
        throw new Error(
          updateResult?.error || "Failed to update user metadata."
        );
      }

      // 초기화 성공 - 로그아웃 제거 (이제 실시간 DB 조회로 인해 바로 사용 가능)
      setSuccess(true);
      
      // 3초 후 메인 페이지로 리다이렉트
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      console.error("초기화 오류:", error);
      setError(
        error instanceof Error
          ? error.message
          : "사용자 정보 업데이트 중 오류가 발생했습니다."
      );
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 배너 */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1">
        <div className="bg-white dark:bg-gray-900 rounded-md p-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            인게임 연동
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            아래 정보를 확인하고 완료 버튼을 눌러주세요.
          </p>
        </div>
      </div>

      {/* Discord 프로필 정보 표시 */}
      <div className="bg-card dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
          <div className="flex items-center space-x-4">
            {discordProfile.avatar ? (
              <div className="relative">
                <Image
                  src={discordProfile.avatar}
                  alt="Discord 프로필"
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-white"
                />
                <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center border-4 border-white">
                <span className="text-2xl text-gray-600">
                  {discordProfile.nickname?.charAt(0) ||
                    discordProfile.username?.charAt(0) ||
                    "?"}
                </span>
              </div>
            )}

            <div className="text-white">
              <h3 className="font-bold text-xl">
                {discordProfile.nickname || "(닉네임 없음)"}
              </h3>
              {discordProfile.username && (
                <p className="text-gray-200 text-sm">
                  Discord: {discordProfile.username}
                  {discordProfile.discriminator &&
                    `#${discordProfile.discriminator}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 역할 표시 */}
        <div className="p-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Discord 역할
          </h4>
          <div className="flex flex-wrap gap-2">
            {discordProfile.roles.length > 0 ? (
              discordProfile.roles.map((role) => (
                <span
                  key={role.id}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${getColorCode(role.color)}20`, // 20은 투명도
                    color:
                      role.color !== 0 ? getColorCode(role.color) : "#4f545c",
                    border: `1px solid ${getColorCode(role.color)}`,
                  }}
                >
                  {role.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                역할이 없습니다.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 게임 ID 표시 */}
      <div className="bg-card dark:bg-gray-800 rounded-lg shadow-md p-5">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          게임 고유 번호
        </h4>
        <p
          className={`text-lg font-semibold ${
            gameId !== null ? "text-primary" : "text-destructive"
          }`}
        >
          {gameId !== null ? gameId : "등록되지 않은 계정"}
        </p>
        {gameId === null && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>오류:</strong> 현재 인게임에서 디스코드 연동이 완료되지 않았습니다.<br />
              ESC 메뉴에서 디스코드 연동을 먼저 진행해주시기 바랍니다.<br />
              만약 인게임에서 디스코드 연동 메뉴가 표시되지 않을 경우, 고객센터로 문의해주시기 바랍니다.
            </p>
          </div>
        )}
      </div>

      {/* 상태 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
연동이 완료되었습니다. 3초 후 메인 페이지로 이동합니다...
          </div>
        </div>
      )}

      {/* 완료 버튼 */}
      <button
        onClick={handleInitialize}
        disabled={isLoading || success || gameId === null}
        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-all ${
          isLoading || success || gameId === null
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            처리 중...
          </div>
        ) : success ? (
          <div className="flex items-center justify-center">
            <svg
              className="h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            완료됨
          </div>
        ) : gameId !== null ? (
          "연동 완료"
        ) : (
          "등록되지 않은 계정"
        )}
      </button>
    </div>
  );
}

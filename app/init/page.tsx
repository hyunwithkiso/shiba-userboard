import { Metadata } from "next";
import InitForm from "@/components/init/init-form";
import { redirect } from "next/navigation";
import { checkGuildMembershipAndFetchProfile } from "@/actions/discord-action";
import { auth } from "@/lib/auth";
import { accounts, db, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getGameIdByDiscordId } from "@/services/game-service";

export const metadata: Metadata = {
  title: "사용자 초기화 | Shiba",
  description: "사용자 정보를 초기화하고 Discord 서버 멤버십을 확인합니다.",
};

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="container mx-auto py-10 text-center">
      <div
        className="max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">오류:</strong>
        <span className="block sm:inline"> {message}</span>
        <p>웹 Discord에 접속하여 계정 정보를 확인해 주세요.</p>
        <p className="text-sm mt-2">문제가 지속될 경우 관리자에게 문의해 주시기 바랍니다.</p>
      </div>
    </div>
  );
}

export default async function InitPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const userDataResult = await db
  .select({
    isInit: users.isInit,
    discordId: accounts.providerAccountId,
  })
  .from(users)
  .leftJoin(
    accounts,
    and(eq(accounts.userId, users.id), eq(accounts.provider, "discord"))
  )
  .where(eq(users.id, userId))
  .limit(1);
  const userData = userDataResult[0];

  if (userData?.isInit) {
    console.log(
      `[InitPage] User ${userId} already initialized (isInit is true). Redirecting home.`
    );
    redirect("/");
  }

  const discordId = userData?.discordId;
  if (!discordId) {
    console.error(`[InitPage] Discord ID not found for user ${userId}.`);
    return (
      <ErrorDisplay message="사용자 정보에서 Discord ID를 찾을 수 없습니다." />
    );
  }

  const discordProfileResult = await checkGuildMembershipAndFetchProfile(
    discordId
  );
  if (!discordProfileResult.success || !discordProfileResult.profile) {
    console.error(
      `[InitPage] Discord membership/profile check failed for ${discordId}: ${discordProfileResult.error}`
    );
    return (
      <ErrorDisplay
        message={
          discordProfileResult.error ||
          "Discord 서버 정보를 확인하지 못했습니다."
        }
      />
    );
  }
  const discordProfile = discordProfileResult.profile;

  let gameId: number | string | null = null;
  try {
    gameId = await getGameIdByDiscordId(discordId);
    if (gameId === null) {
      console.warn(
        `[InitPage] No game ID found for Discord ID: ${discordId}. Proceeding with null gameId.`
      );
    }
  } catch (error) {
    const gameIdError =
      error instanceof Error
        ? error.message
        : "게임 ID 조회 중 오류가 발생했습니다.";
    console.error(
      `[InitPage] Game ID fetch error: ${gameIdError}. Proceeding with null gameId.`
    );
  }

  return (
    <div className="container mx-auto py-24">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">유저 정보 확인</h1>
          <p className="text-muted-foreground">
          인게임 연동 정보를 확인하고 완료해주세요.
          </p>
        </div>
        <InitForm
          discordProfile={{
            roles: discordProfile?.roles || [],
            nickname: discordProfile?.nickname || "",
            avatar: discordProfile?.avatar || undefined,
            username: discordProfile?.username,
            discriminator: discordProfile?.discriminator,
          }}
          gameId={gameId}
        />
      </div>
    </div>
  );
}

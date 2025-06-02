// 서버에서만 실행되는 서비스 레이어
export class RealtimeService {
  async getPlayersCount() {
    try {
      // API URL이 없으면 기본값 반환
      if (!process.env.SHIBA_API_URL) {
        console.warn("SHIBA_API_URL is not defined, returning default value");
        return { playerNum: 0 };
      }

      const response = await fetch(
        `${process.env.SHIBA_API_URL}/getPlayersCount`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            key: process.env.SHIBA_API_KEY || "",
          },
          // 빌드 시 타임아웃 방지

          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.warn("Failed to fetch players count, returning default value");
        return { playerNum: 0 };
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching players count:", error);
      // 오류 발생 시 기본값 반환
      return { playerNum: 0 };
    }
  }

  async getPlayers() {
    try {
      if (!process.env.SHIBA_API_URL) {
        console.warn("SHIBA_API_URL is not defined, returning default value");
        return [];
      }

      const response = await fetch(
        `${process.env.SHIBA_API_URL}/getOnlinePlayers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            key: process.env.SHIBA_API_KEY || "",
          },
          // 빌드 시 타임아웃 방지
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.warn("Failed to fetch players, returning default value");
        return [];
      }

      const data = await response.json();
      // user_id 기준으로 오름차순 정렬
      const sortedUsers = data.users
        ? [...data.users].sort((a, b) => a.user_id - b.user_id)
        : [];
      return sortedUsers;
    } catch (error) {
      console.error("Error fetching players:", error);
      // 오류 발생 시 기본값 반환
      return [];
    }
  }

  //       "KillFeedTicket"
  // "ChatTitleTicket"

  async getCheckAvailableKillFeed(userId: number) {
    try {
      const user = await fetch(`${process.env.SHIBA_API_URL}/getPlayerData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          key: process.env.SHIBA_API_KEY || "",
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const userData = await user.json();
      const ticket = userData?.inventory?.KillFeedTicket;
      if (!ticket) {
        return { amount: 0, name: "킬피드 이용권", notFound: true };
      }
      return ticket;
    } catch (e) {
      return { amount: 0, name: "킬피드 이용권", notFound: true, error: e };
    }
  }

  async getCheckAvailableChatTitle(userId: number) {
    try {
      const user = await fetch(`${process.env.SHIBA_API_URL}/getPlayerData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          key: process.env.SHIBA_API_KEY || "",
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const userData = await user.json();
      const ticket = userData?.inventory?.ChatTitleTicket;
      if (!ticket) {
        return { amount: 0, name: "채팅 칭호 이용권", notFound: true };
      }
      return ticket;
    } catch (e) {
      return { amount: 0, name: "채팅 칭호 이용권", notFound: true, error: e };
    }
  }

  async updateKillFeedAmount(user_id: string) {
    const response = await fetch(
      `${process.env.SHIBA_API_URL}/updatePlayerItem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          key: process.env.SHIBA_API_KEY || "",
        },
        body: JSON.stringify({
          user_id: user_id,
          itemcode: "KillFeedTicket",
          amount: 1,
          type: "remove",
        }),
      }
    );

    return response.json();
  }

  async updateChatTitleAmount(user_id: string) {
    const response = await fetch(
      `${process.env.SHIBA_API_URL}/updatePlayerItem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          key: process.env.SHIBA_API_KEY || "",
        },
        body: JSON.stringify({
          user_id: user_id,
          itemcode: "ChatTitleTicket",
          amount: 1,
          type: "remove",
        }),
      }
    );

    return response.json();
  }
}
export const realtimeService = new RealtimeService();

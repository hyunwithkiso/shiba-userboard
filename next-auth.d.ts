import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier. */
      id: string;
      /** The user's nickname. */
      nickname?: string | null;
      /** The user's game identifier (assuming from DB 'userId' field). */
      gameId?: string | null;
      /** The user's Discord ID. */
      discordId?: string | null;
    } & DefaultSession["user"]; // 기존 필드 (name, email, image) 유지
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    nickname?: string | null;
    gameId?: string | null; // DB의 userId 필드
    discordId?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** User ID */
    id?: string;
    /** Nickname */
    nickname?: string | null;
    /** Game ID */
    gameId?: string | null;
    /** Discord ID */
    discordId?: string | null;
  }
}

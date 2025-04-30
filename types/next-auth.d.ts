import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id: string;
      isAdmin?: boolean | null;
      userId?: string | null;
      discordId?: string | null;
    } & DefaultSession["user"];
  }

  /** The basic user model */
  interface User extends DefaultUser {
    isAdmin?: boolean | null;
    userId?: string | null;
    discordId?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    isAdmin?: boolean | null;
    userId?: string | null;
    discordId?: string | null;
  }
}

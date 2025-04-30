import NextAuth, { type NextAuthConfig, type Profile } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, accounts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Adapter } from "@auth/core/adapters";

const originalAdapter = DrizzleAdapter(db);

const CustomDrizzleAdapter: Adapter = {
  ...originalAdapter,

  async createUser(user) {
    const discordId = (user as any).discordId as string | undefined;

    const createdUser = await originalAdapter.createUser!(user);

    if (createdUser && discordId) {
      try {
        console.log(
          `[CustomAdapter:createUser] Updating discordId (${discordId}) for user ${createdUser.id}`
        );
        await db
          .update(users)
          .set({ discordId: discordId, updatedAt: new Date() })
          .where(eq(users.id, createdUser.id));
        console.log(
          `[CustomAdapter:createUser] Successfully updated discordId for user ${createdUser.id}`
        );
      } catch (error) {
        console.error(
          `[CustomAdapter:createUser] Failed to update discordId for user ${createdUser.id}:`,
          error
        );
      }
    } else if (!discordId) {
      console.warn(
        `[CustomAdapter:createUser] discordId not found in user object for ${createdUser.id}. Profile function might be missing discordId.`
      );
    }

    return createdUser;
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  adapter: CustomDrizzleAdapter,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile: Profile & { id?: string }) {
        const userProfile = {
          id: profile.id!,
          name: profile.name,
          email: profile.email,
          image: profile.image as string | null | undefined,
          discordId: profile.id,
        };
        console.log("[Discord Provider Profile]:", userProfile);
        return userProfile;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.nickname && session.user) {
        session.user.nickname = token.nickname;
      }
      if (token.gameId && session.user) {
        session.user.gameId = token.gameId;
      }
      if (token.discordId && session.user) {
        session.user.discordId = token.discordId;
      }
      if (token.isAdmin !== undefined && session.user) {
        session.user.isAdmin = token.isAdmin;
      }

      if (token.userId && session.user) {
        session.user.userId = token.userId;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user?.id) {
        token.sub = user.id;
        token.discordId = (user as any).discordId || token.discordId;
        token.userId = (user as any).userId || token.userId;
        try {
          console.log(
            `[JWT Callback] Fetching DB user info for id: ${user.id}`
          );
          const dbUser = await db
            .select({
              nickname: users.nickname,
              userId: users.userId,
              isAdmin: users.isAdmin,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

          if (dbUser.length > 0) {
            token.nickname = dbUser[0].nickname;
            token.userId = dbUser[0].userId;
            token.isAdmin = dbUser[0].isAdmin ?? false;
            console.log(
              `[JWT Callback] User info fetched: nickname=${token.nickname}, userId=${token.userId}, isAdmin=${token.isAdmin}`
            );
          } else {
            console.warn(
              `[JWT Callback] User not found in DB for id: ${user.id}`
            );
            token.isAdmin = false;
          }
        } catch (dbError) {
          console.error(
            "[JWT Callback] Error fetching user data from DB:",
            dbError
          );
          token.isAdmin = false;
        }

        if (!token.discordId && (profile as any)?.id) {
          token.discordId = String((profile as any).id);
        }

        if (!token.userId && (profile as any)?.id) {
          token.userId = String((profile as any).id);
        }
      }
      if (account?.provider === "discord" && account.providerAccountId) {
        token.discordId = account.providerAccountId;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log("[signIn Callback] User:", user);
      console.log("[signIn Callback] Account:", account);
      console.log("[signIn Callback] Profile:", profile);
      return true;
    },
  },
});

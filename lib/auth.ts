import NextAuth, { type Profile } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { users } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  adapter: DrizzleAdapter(db),
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
        };
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
      if (token.userId && session.user) {
        session.user.userId = token.userId;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user?.id) {
        token.sub = user.id;
        token.userId = (user as any).userId || token.userId;
        try {
          const dbUser = await db
            .select({
              nickname: users.nickname,
              userId: users.userId,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

          if (dbUser.length > 0) {
            token.nickname = dbUser[0].nickname;
            token.userId = dbUser[0].userId;
            console.log(
              `[JWT Callback] User info fetched: nickname=${token.nickname}, userId=${token.userId}`
            );
          } else {
            console.warn(
              `[JWT Callback] User not found in DB for id: ${user.id}`
            );
          }
        } catch (dbError) {
          console.error(
            "[JWT Callback] Error fetching user data from DB:",
            dbError
          );
        }
      }
      return token;
    },
  },
});

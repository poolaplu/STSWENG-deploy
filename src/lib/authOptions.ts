import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

import bcrypt from "bcryptjs";
import dbConnect from "./mongoose";
import UserAccount from "./models/useraccounts/user";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const { username, password, rememberMe } = credentials ?? {};

        if (!username || !password) {
          throw new Error("Please enter both username and password.");
        }

        await dbConnect();
        const user = await UserAccount.findOne({ username });

        if (!user) {
          throw new Error("No account found for this username.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: user._id.toString(),
          username: user.username,
          email: user.username,
          role: user.role,
          rememberMe: rememberMe === "true",
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // Optional: set a long default maxAge (e.g., 30 days) to give tokens a longer base TTL
    maxAge: 60 * 60 * 24 * 30,
  },

  callbacks: {
    async jwt({ token, user }) {
  if (user) {
    const typedUser = user as typeof user & { rememberMe?: boolean };

    token.id = typedUser.id;
    token.username = typedUser.username;
    token.role = typedUser.role;
    token.rememberMe = typedUser.rememberMe ?? false;

    token.exp = Math.floor(Date.now() / 1000) +
      (typedUser.rememberMe ? 60 * 60 * 24 * 30 : 60 * 15); // 30 days or 15 min
  }

  if (token.exp && Date.now() / 1000 > token.exp) {
    throw new Error("Session expired");
  }

  return token;
},


    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }

      session.expires = new Date((token.exp ?? 0) * 1000).toISOString();

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            role: string;
            rememberMe?: boolean;
        };
    }

    interface User {
        id: string;
        username: string;
        role: string;
        rememberMe?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        role: string;
        rememberMe?: boolean;
        exp?: number;
    }
}

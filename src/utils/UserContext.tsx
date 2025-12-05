"use client";

import { createContext, useContext } from "react";

export type UserRole = "admin" | "member";

export interface SessionUser {
    id: string;
    username: string;
    role: UserRole;
}

const UserContext = createContext<SessionUser | null>(null);

export default function UserProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a <UserProvider>");
    }
    return context;
};

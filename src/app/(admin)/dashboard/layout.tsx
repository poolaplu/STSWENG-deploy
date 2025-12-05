import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import Breadcrumb from "./components/Breadcrumb";
import styles from "@/styles/dashboard.module.css";
import { redirect } from "next/navigation";
import DashboardDataProvider from "@/utils/DashboardContext";
import UserProvider, { SessionUser, UserRole } from "@/utils/UserContext";
import { getSessionUser } from "@/lib/sessions";

export const metadata: Metadata = {
    title: "Synagogue for Jesus Database",
    description: "App",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionUser();

    if (!user || !user.id || !user.username || !user.role) {
        redirect("/login");
    }

    const typedUser: SessionUser = {
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
    };

    return (
        <UserProvider user={typedUser}>
            <div className={styles.container}>
                <Sidebar />
                <DashboardDataProvider>
                    <div className={styles.main}>
                        <Breadcrumb />
                        <div className={styles.content}>{children}</div>
                    </div>
                </DashboardDataProvider>
            </div>
        </UserProvider>
    );
}

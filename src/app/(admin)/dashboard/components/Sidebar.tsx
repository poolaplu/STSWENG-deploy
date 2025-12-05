"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "@/styles/sidebar.module.css";
import loading from "@/styles/loading.module.css";

const sidebarSections = [
    {
        title: "HOME",
        items: [{ id: "dashboard", label: "Dashboard" }],
    },
    {
        title: "RECORDS",
        items: [
            { id: "households", label: "Household" },
            { id: "members", label: "Members" },
            { id: "donations", label: "Donations" },
        ],  
    },
    {
        title: "PROGRAMS",
        items: [
            { id: "interventions", label: "Interventions" },
            { id: "feeding", label: "Feeding" },
            { id: "livelihood", label: "Livelihood" },
        ],
    },
    {
        title: "BLOGGING",
        items: [{ id: "blog", label: "Blog" }],
    },
    {
        title: "SETTINGS",
        items: [{ id: "site-editor", label: "Site Editor" },
                { id: "programs", label: "Manage Programs" },
        ],
        
    },
];

export default function Sidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const role = session?.user?.role || "guest";
    const roleLabel = role === "member" ? "Database Manager" : role === "admin" ? "System Administrator" : "Guest";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const logoutBtn = document.getElementById("logout-button");

            if (dropdownRef.current && !dropdownRef.current.contains(target) && logoutBtn && !logoutBtn.contains(target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNavigation = (href: string) => {
        if (pathname !== href) {
            startTransition(() => {
                router.push(href);
            });
        }
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.logoContainer}>
                    <img src="/images/sfg_logo.png" alt="SFG Logo" className={styles.logoImage} />
                </div>
                <div className={styles.brandText}>
                    <span className={styles.brandName}>SYNAGOGUE FOR JESUS</span>
                    <span className={styles.brandSubtitle}>DATABASE</span>
                </div>
            </div>

            <nav className={styles.navigation}>
                {sidebarSections.map((section) => (
                    <div key={section.title} className={styles.section}>
                        <h4 className={styles.sectionTitle}>{section.title}</h4>
                        <ul className={styles.list}>
                            {section.items.map((tab) => {
                                const href = tab.id === "dashboard" ? "/dashboard" : `/dashboard/${tab.id}`;
                                const isActive = pathname === href;

                                return (
                                    <li key={tab.id} className={styles.listItem}>
                                        <button
                                            onClick={() => handleNavigation(href)}
                                            className={`${styles.link} ${isActive ? styles.activeLink : ""}`}
                                            disabled={isPending && !isActive}>
                                            <span className={styles.linkText}>{tab.label}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className={styles.profileSection}>
                <div className={styles.profileMenu} ref={dropdownRef} onClick={() => setShowDropdown((prev) => !prev)} data-open={showDropdown}>
                    <div className={styles.profileInfo}>
                        <span className={styles.profileName}>{role.toUpperCase()}</span>
                        <span className={styles.profileRole}>{roleLabel}</span>
                    </div>
                    <span className={styles.dropdownArrow}>▼</span>
                </div>

                {showDropdown && (
                    <div className={styles.dropdownMenu}>
                        <button id="logout-button" onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutButton}>
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
            </div>
            {isPending && (
                <div className={loading.loadingOverlay}>
                    <div className={loading.loadingSpinner}></div>
                </div>
            )}
        </aside>
    );
}

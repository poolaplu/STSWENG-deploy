"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import styles from "@/styles/breadcrumb.module.css";
import { useDashboardData } from "@/utils/DashboardContext"; // adjust if path differs

export default function Breadcrumb() {
    const pathname = usePathname();
    const router = useRouter();
    const [_, startTransition] = useTransition();
    const { feedings, interventions } = useDashboardData();

    const segments = pathname.split("/").filter(Boolean);

    const breadcrumb = segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");

        let label = segment.charAt(0).toUpperCase() + segment.slice(1);

        // Special case for /dashboard/feeding/[id]
        if (segments[index - 1] === "feeding" && segments[index - 2] === "dashboard") {
            const feedingItem = feedings.find((f) => f._id === segment);
            if (feedingItem) {
                label = feedingItem.name || "Feeding Detail";
            }
        }

        if (segments[index - 1] === "interventions" && segments[index - 2] === "dashboard") {
            const intervention = interventions.find((f) => f._id === segment);
            if (intervention) {
                label = intervention.name || "Feeding Detail";
            }
        }

        return { label, href };
    });

    const handleNavigate = (href: string) => {
        if (href !== pathname) {
            startTransition(() => {
                router.push(href);
            });
        }
    };

    if (breadcrumb.length === 0) return null;

    return (
        <div className={styles.breadcrumbNav}>
            {breadcrumb.map((item, idx) => (
                <span key={item.href}>
                    {idx < breadcrumb.length - 1 ? (
                        <a
                            href={item.href}
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigate(item.href);
                            }}
                            className={styles.breadcrumbLink}>
                            {item.label}
                        </a>
                    ) : (
                        <span className={styles.breadcrumbCurrent}>{item.label}</span>
                    )}
                    {idx < breadcrumb.length - 1 && " / "}
                </span>
            ))}
        </div>
    );
}

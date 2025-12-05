"use client";
import { createContext, useContext } from "react";
import useSWR from "swr";

const options = { dedupingInterval: 5000, fallbackData: [] };
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const DashboardDataContext = createContext<{
    members: any[];
    interventions: any[];
    households: any[];
    feedings: any[];
    transactions: any[];
    livelihoods: any[];
    donations: any[];
    blogs: any[];
}>({
    members: [],
    interventions: [],
    households: [],
    feedings: [],
    transactions: [],
    livelihoods: [],
    donations: [],
    blogs: [],
});

export const useDashboardData = () => useContext(DashboardDataContext);

export default function DashboardDataProvider({ children }: { children: React.ReactNode }) {
    const { data: members = [] } = useSWR("/api/member", fetcher, options);
    const { data: interventions = [] } = useSWR("/api/intervention", fetcher, options);
    const { data: households = [] } = useSWR("/api/household", fetcher, options);
    const { data: feedings = [] } = useSWR("/api/feeding", fetcher, options);
    const { data: transactions = [] } = useSWR("/api/transaction", fetcher, options);
    const { data: livelihoods = [] } = useSWR("/api/livelihood", fetcher, options);
    const { data: donations = [] } = useSWR("/api/donation", fetcher, options);
    const { data: blogs = [] } = useSWR("/api/blogs", fetcher, options);

    return (
        <DashboardDataContext.Provider
            value={{
                members,
                interventions,
                households,
                feedings,
                transactions,
                livelihoods,
                donations,
                blogs,
            }}
        >
            {children}
        </DashboardDataContext.Provider>
    );
}

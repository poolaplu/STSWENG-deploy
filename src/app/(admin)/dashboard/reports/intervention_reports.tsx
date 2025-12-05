"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Calendar, Users, Home, Heart, Gift, Utensils, TrendingUp } from "lucide-react";
import { HOA_STATUS_OPTIONS } from "@/types/households";
import { useDashboardData } from "@/utils/DashboardContext";
import styles from "@/styles/reports.module.css";

type TabButtonProps = {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    isActive: boolean;
    onClick: (id: string) => void;
};

type StatCardProps = {
    title: string;
    value: string | number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color?: string;
};

type ChartConfig = {
    xKey?: string;
    yKey?: string;
    color?: string;
};

const TIME_FILTERS = [
    { value: 7, label: "Past Week" },
    { value: 30, label: "Past Month" },
    { value: 180, label: "Past 6 Months" },
    { value: 365, label: "Past Year" },
    { value: "all", label: "All Time" },
];

const COLORS = {
    primary: "#3B82F6",
    secondary: "#10B981",
    accent: "#F59E0B",
    danger: "#EF4444",
    purple: "#8B5CF6",
    pink: "#EC4899",
    indigo: "#6366F1",
    teal: "#14B8A6",
};

const CHART_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.accent,
    COLORS.danger,
    COLORS.purple,
    COLORS.pink,
];

// Helper function to sort monthly data chronologically
const sortMonthlyData = (data: any[]) => {
    return data.sort((a, b) => {
        const dateA = new Date(a.month + " 1");
        const dateB = new Date(b.month + " 1");
        return dateA.getTime() - dateB.getTime();
    });
};

// Helper function to sort data alphabetically by a given key
const sortAlphabetically = (data: any[], key: string) => {
    return data.sort((a, b) => {
        const valueA = (a[key] || "").toString().toLowerCase();
        const valueB = (b[key] || "").toString().toLowerCase();
        return valueA.localeCompare(valueB);
    });
};

export default function ComprehensiveReports() {
    const { interventions, members, households, livelihoods, donations, feedings } = useDashboardData();
    const [selectedTimeFilter, setSelectedTimeFilter] = useState<number | "all">(30);
    const [activeTab, setActiveTab] = useState("members");

    const filterByDate = (items: any, dateField: string): any[] => {
        if (!Array.isArray(items)) return [];

        if (selectedTimeFilter === "all") return items;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(selectedTimeFilter));

        return items.filter((item) => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= cutoffDate;
        });
    };

    const donationReports = useMemo(() => {
        const filtered = filterByDate(donations, "date");

        const totalValue = filtered.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        const itemVsMonetary = filtered.reduce(
            (acc, d) => {
                const value = parseFloat(d.value || 0);
                if (d.isItem) acc.items += value;
                else acc.monetary += value;
                return acc;
            },
            { items: 0, monetary: 0 }
        );

        const byMonth = filtered.reduce((acc, d) => {
            const month = new Date(d.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
            acc[month] = (acc[month] || 0) + parseFloat(d.value || 0);
            return acc;
        }, {});

        const monthlyData = sortMonthlyData(Object.entries(byMonth).map(([month, value]) => ({ month, value })));

        const pieData = [
            { name: "Item Donations", value: itemVsMonetary.items, color: COLORS.primary },
            { name: "Monetary Donations", value: itemVsMonetary.monetary, color: COLORS.secondary },
        ];

        return { totalValue, monthlyData, pieData, count: filtered.length };
    }, [donations, selectedTimeFilter]);

    const feedingReports = useMemo(() => {
        const filtered = filterByDate(feedings, "date_started");

        const statusBreakdown = filtered.reduce((acc: Record<string, number>, f: any) => {
            acc[f.status] = (acc[f.status] || 0) + 1;
            return acc;
        }, {});

        const totalBeneficiaries = filtered.reduce((sum, f) => {
            const count = Array.isArray(f.beneficiaries) ? f.beneficiaries.length : 0;
            return sum + count;
        }, 0);

        const statusData = sortAlphabetically(Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })), 'status');

        const pieData = Object.entries(statusBreakdown).map(([status, count]: [string, number]) => ({
            name: status,
            value: count,
            color: COLORS.accent,
        }));

        return { statusData, totalBeneficiaries, pieData, count: filtered.length };
    }, [feedings, selectedTimeFilter]);

    const householdReports = useMemo(() => {
        const clusterBreakdown = households.reduce((acc, h) => {
            const cluster = h.cluster || "Unknown";
            acc[cluster] = (acc[cluster] || 0) + 1;
            return acc;
        }, {});

        const ownershipBreakdown = households.reduce((acc, h) => {
            const ownership = h.ownership || "Unknown";
            acc[ownership] = (acc[ownership] || 0) + 1;
            return acc;
        }, {});

        const hoaStatusBreakdown = households.reduce((acc, h) => {
            const status = h.hoa_status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const hoaStatusBreakdownComplete = HOA_STATUS_OPTIONS.reduce((acc, status) => {
  acc[status] = hoaStatusBreakdown[status] ?? 0;
  return acc;
}, {} as Record<string, number>);

        const clusterData = sortAlphabetically(Object.entries(clusterBreakdown).map(([cluster, count]) => ({ cluster, count })), 'cluster');
        const ownershipData = sortAlphabetically(Object.entries(ownershipBreakdown).map(([ownership, count]) => ({
            ownership,
            count,
        })), 'ownership');
       const hoaData = Object.entries(hoaStatusBreakdownComplete)
  .map(([status, count]) => ({ status, count }))
  .sort((a, b) => {
    const getNumber = (str: string) => {
      const match = str.match(/\d+/);
      return match ? parseInt(match[0], 10) : 9999;
    };
    return getNumber(a.status) - getNumber(b.status);
  });


        return { clusterData, ownershipData, hoaData, count: households.length };
    }, [households]);

    const interventionReports = useMemo(() => {
        const filtered = filterByDate(interventions, "date");

        const typeBreakdown = filtered.reduce((acc, i) => {
            const type = i.type || "Unknown";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const byMonth = filtered.reduce((acc, i) => {
            const month = new Date(i.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});

        const monthlyData = sortMonthlyData(Object.entries(byMonth).map(([month, count]) => ({ month, count })));
        const typeData = sortAlphabetically(Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })), 'type');

        return { typeData, monthlyData, count: filtered.length };
    }, [interventions, selectedTimeFilter]);

    const livelihoodReports = useMemo(() => {
        const filtered = livelihoods.filter((l) => {
            if (selectedTimeFilter === "all") return true;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - selectedTimeFilter);
            const createdDate = l.date_created ? new Date(l.date_created) : new Date();
            return createdDate >= cutoffDate;
        });

        const byMonth = filtered.reduce((acc, l) => {
            const createdDate = l.date_created ? new Date(l.date_created) : new Date();
            const month = createdDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});

        const monthlyData = sortMonthlyData(Object.entries(byMonth).map(([month, count]) => ({ month, count })));

        return { monthlyData, count: filtered.length };
    }, [livelihoods, selectedTimeFilter]);

    const memberReports = useMemo(() => {
        const sexBreakdown = members.reduce((acc, m) => {
            const sex = m.sex || "Unknown";
            acc[sex] = (acc[sex] || 0) + 1;
            return acc;
        }, {});

        const ageGroups = members.reduce(
            (acc, m) => {
                if (!m.birthdate) {
                    acc["Unknown"]++;
                    return acc;
                }
                const age = new Date().getFullYear() - new Date(m.birthdate).getFullYear();
                if (age < 18) acc["Under 18"]++;
                else if (age < 35) acc["18-34"]++;
                else if (age < 60) acc["35-59"]++;
                else acc["60+"]++;
                return acc;
            },
            { "Under 18": 0, "18-34": 0, "35-59": 0, "60+": 0, Unknown: 0 }
        );

        const sexData = sortAlphabetically(Object.entries(sexBreakdown).map(([sex, count]) => ({ sex, count })), 'sex');
        
        const ageGroupOrder = ["Under 18", "18-34", "35-59", "60+", "Unknown"];
        const ageData = Object.entries(ageGroups)
            .map(([group, count]) => ({ group, count }))
            .sort((a, b) => {
                const indexA = ageGroupOrder.indexOf(a.group);
                const indexB = ageGroupOrder.indexOf(b.group);
                return indexA - indexB;
            });

        return { sexData, ageData, count: members.length };
    }, [members]);

    const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick }) => (
        <button
            onClick={() => onClick(id)}
            className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}>
            <Icon size={18} />
            {label}
        </button>
    );

    const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = COLORS.primary }) => (
        <div className={styles.statCard}>
            <div className={styles.statCardContent}>
                <div>
                    <p className={styles.statCardTitle}>{title}</p>
                    <p className={styles.statCardValue}>{value}</p>
                </div>
                <div className={styles.statCardIcon} style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
            </div>
        </div>
    );

    const renderChart = (type: string, data: any[], config: ChartConfig = {}) => {
        const chartProps = {
            width: "100%",
            height: 300,
            data,
            ...config,
        };

        switch (type) {
            case "bar":
                return (
                    <ResponsiveContainer {...chartProps}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={config.xKey || "name"} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={config.yKey || "value"} fill={config.color || COLORS.primary} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case "line":
                return (
                    <ResponsiveContainer {...chartProps}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={config.xKey || "name"} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey={config.yKey || "value"}
                                stroke={config.color || COLORS.primary}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case "pie":
                return (
                    <ResponsiveContainer {...chartProps}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value">
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "donations":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.statsGrid}>
                            <StatCard
                                title="Total Donations"
                                value={donationReports.count}
                                icon={Gift}
                                color={COLORS.primary}
                            />
                            <StatCard
                                title="Total Value"
                                value={`₱${donationReports.totalValue.toLocaleString()}`}
                                icon={TrendingUp}
                                color={COLORS.secondary}
                            />
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Monthly Donation Values</h4>
                                {renderChart("line", donationReports.monthlyData, {
                                    xKey: "month",
                                    yKey: "value",
                                    color: COLORS.primary,
                                })}
                            </div>

                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Item vs Monetary Donations</h4>
                                {renderChart("pie", donationReports.pieData)}
                            </div>
                        </div>
                    </div>
                );

            case "feedings":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.statsGrid}>
                            <StatCard
                                title="Total Programs"
                                value={feedingReports.count}
                                icon={Utensils}
                                color={COLORS.accent}
                            />
                            <StatCard
                                title="Total Beneficiaries"
                                value={feedingReports.totalBeneficiaries}
                                icon={Users}
                                color={COLORS.secondary}
                            />
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Program Status</h4>
                                {renderChart("bar", feedingReports.statusData, {
                                    xKey: "status",
                                    yKey: "count",
                                    color: COLORS.accent,
                                })}
                            </div>

                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Status Distribution</h4>
                                {renderChart("pie", feedingReports.pieData)}
                            </div>
                        </div>
                    </div>
                );

            case "households":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.statsGrid}>
                            <StatCard
                                title="Total Households"
                                value={householdReports.count}
                                icon={Home}
                                color={COLORS.purple}
                            />
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Households by Cluster</h4>
                                {renderChart("bar", householdReports.clusterData, {
                                    xKey: "cluster",
                                    yKey: "count",
                                    color: COLORS.purple,
                                })}
                            </div>

                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Ownership Status</h4>
                                {renderChart(
                                    "pie",
                                    householdReports.ownershipData.map((item, index) => ({
                                        ...item,
                                        name: item.ownership,
                                        value: item.count,
                                        color: CHART_COLORS[index],
                                    }))
                                )}
                            </div>

                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>HOA Status</h4>
                                {renderChart("bar", householdReports.hoaData, {
                                    xKey: "status",
                                    yKey: "count",
                                    color: COLORS.indigo,
                                })}
                            </div>
                        </div>
                    </div>
                );

            case "interventions":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.statsGrid}>
                            <StatCard
                                title="Total Interventions"
                                value={interventionReports.count}
                                icon={Heart}
                                color={COLORS.danger}
                            />
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Monthly Interventions</h4>
                                {renderChart("line", interventionReports.monthlyData, {
                                    xKey: "month",
                                    yKey: "count",
                                    color: COLORS.danger,
                                })}
                            </div>

                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Interventions by Type</h4>
                                {renderChart("bar", interventionReports.typeData, {
                                    xKey: "type",
                                    yKey: "count",
                                    color: COLORS.danger,
                                })}
                            </div>
                        </div>
                    </div>
                );

            case "livelihoods":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.statsGrid}>
                            <StatCard
                                title="Total Livelihoods"
                                value={livelihoodReports.count}
                                icon={TrendingUp}
                                color={COLORS.teal}
                            />
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Monthly Creation</h4>
                                {renderChart("line", livelihoodReports.monthlyData, {
                                    xKey: "month",
                                    yKey: "count",
                                    color: COLORS.teal,
                                })}
                            </div>
                        </div>
                    </div>
                );

            case "members":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.statsGrid}>
                            <StatCard
                                title="Total Members"
                                value={memberReports.count}
                                icon={Users}
                                color={COLORS.pink}
                            />
                        </div>

                        <div className={styles.chartsGrid}>
                            <div className={styles.chartContainer}>
                                <h4 className={styles.chartTitle}>Age Groups</h4>
                                {renderChart("bar", memberReports.ageData, {
                                    xKey: "group",
                                    yKey: "count",
                                    color: COLORS.pink,
                                })}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Comprehensive Reports</h2>
                <div className={styles.timeFilter}>
                    <label className={styles.filterLabel}>Time Period:</label>
                    <select
                        value={selectedTimeFilter}
                        onChange={(e) =>
                            setSelectedTimeFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                        }
                        className={styles.filterSelect}>
                        {TIME_FILTERS.map((filter) => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.tabs}>
                <TabButton
                    id="members"
                    label="Members"
                    icon={Users}
                    isActive={activeTab === "members"}
                    onClick={setActiveTab}
                />

                <TabButton
                    id="households"
                    label="Households"
                    icon={Home}
                    isActive={activeTab === "households"}
                    onClick={setActiveTab}
                />

                <TabButton
                    id="donations"
                    label="Donations"
                    icon={Gift}
                    isActive={activeTab === "donations"}
                    onClick={setActiveTab}
                />

                <TabButton
                    id="interventions"
                    label="Interventions"
                    icon={Heart}
                    isActive={activeTab === "interventions"}
                    onClick={setActiveTab}
                />

                <TabButton
                    id="feedings"
                    label="Feeding Programs"
                    icon={Utensils}
                    isActive={activeTab === "feedings"}
                    onClick={setActiveTab}
                />

                <TabButton
                    id="livelihoods"
                    label="Livelihoods"
                    icon={TrendingUp}
                    isActive={activeTab === "livelihoods"}
                    onClick={setActiveTab}
                />
            </div>

            {renderTabContent()}
        </div>
    );
}
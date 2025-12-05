"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import styles from "./feeding.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { Feeding, FeedingProgramStatus } from "@/types/feedings";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FeedingModal from "./feeding_modal";
import { saveFeedingProgram, deleteFeedingProgram } from "@/lib/api/feedings";
import SectionExportButton from "@/app/components/SectionExportButton";

const SORT_OPTIONS = [
    { value: "date_started_desc", label: "Start Date (Newest)" },
    { value: "date_started", label: "Start Date (Oldest)" },
    { value: "last_modified_desc", label: "Last Modified (Newest)" },
    { value: "last_modified", label: "Last Modified (Oldest)" },
    { value: "name", label: "Name A-Z" },
    { value: "name_desc", label: "Name Z-A" },
    { value: "status", label: "Status" },
];

const initialFeedingProgram: Feeding = {
    name: "",
    description: "",
    date_started: new Date().toISOString(),
    date_ended: undefined,
    last_modified: new Date().toISOString(),
    status: "To Be Done",
    beneficiaries: [],
    pinned: false,
};

export default function FeedingTab() {
    const { feedings } = useDashboardData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdd, setIsAdd] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editData, setEditData] = useState<Feeding | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateRangeStart, setDateRangeStart] = useState("");
    const [dateRangeEnd, setDateRangeEnd] = useState("");
    const [sortBy, setSortBy] = useState("date_started_desc");
    const [showFilters, setShowFilters] = useState(false);
    const [localPinnedState, setLocalPinnedState] = useState<Record<string, boolean>>({});

    const router = useRouter();

    // Apply filters and sorting
    const filteredAndSortedFeedings = useMemo(() => {
        // Apply localPinnedState overrides to original feedings
        const locallyUpdatedFeedings = (Array.isArray(feedings) ? feedings : []).map((program) => ({
            ...program,
            pinned: localPinnedState[program._id!] ?? program.pinned,
        }));

        // Apply filters
        let filtered = locallyUpdatedFeedings.filter((program) => {
            // Search filter
            if (searchTerm && !program.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Status filter
            if (statusFilter !== "all" && program.status !== statusFilter) {
                return false;
            }

            // Date range filter
            if (dateRangeStart || dateRangeEnd) {
                const startDate = new Date(program.date_started);
                if (dateRangeStart && startDate < new Date(dateRangeStart)) {
                    return false;
                }
                if (dateRangeEnd && startDate > new Date(dateRangeEnd)) {
                    return false;
                }
            }

            return true;
        });

        // Sort programs
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "name_desc":
                    return b.name.localeCompare(a.name);
                case "date_started":
                    return new Date(a.date_started).getTime() - new Date(b.date_started).getTime();
                case "date_started_desc":
                    return new Date(b.date_started).getTime() - new Date(a.date_started).getTime();
                case "last_modified":
                    return new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
                case "last_modified_desc":
                    return new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime();
                case "status":
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [feedings, localPinnedState, searchTerm, statusFilter, dateRangeStart, dateRangeEnd, sortBy]);

    const pinnedPrograms = filteredAndSortedFeedings.filter((p) => p.pinned);

    // Get current date and calculate time boundaries
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const monthAfterNext = nextMonth === 11 ? 0 : nextMonth + 1;
    const monthAfterNextYear = nextMonth === 11 ? nextMonthYear + 1 : nextMonthYear;

    // Month names for display
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    function sortPrograms(programs: Feeding[], sortBy: string): Feeding[] {
        return programs.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "name_desc":
                    return b.name.localeCompare(a.name);
                case "date_started":
                    return new Date(a.date_started).getTime() - new Date(b.date_started).getTime();
                case "date_started_desc":
                    return new Date(b.date_started).getTime() - new Date(a.date_started).getTime();
                case "last_modified":
                    return new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
                case "last_modified_desc":
                    return new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime();
                case "status":
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });
    }

    // Function to categorize programs by time
    function categorizePrograms(programs: Feeding[], sortBy: string) {
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const monthAfterNext = nextMonth === 11 ? 0 : nextMonth + 1;
        const monthAfterNextYear = nextMonth === 11 ? nextMonthYear + 1 : nextMonthYear;

        const upcoming: Feeding[] = [];
        const thisMonth: Feeding[] = [];
        const nextMonthPrograms: Feeding[] = [];
        const monthAfterNextPrograms: Feeding[] = [];
        const pastPrograms: Feeding[] = [];
        const completedPrograms: Feeding[] = [];
        const comingSoon: Feeding[] = [];

        programs.forEach((program) => {
            const startDate = new Date(program.date_started);

            if (program.status === "Done") {
                completedPrograms.push(program);
            } else if (startDate < now) {
                pastPrograms.push(program);
            } else if (startDate >= now && startDate <= twoWeeksFromNow) {
                upcoming.push(program);
            } else if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
                thisMonth.push(program);
            } else if (startDate.getMonth() === nextMonth && startDate.getFullYear() === nextMonthYear) {
                nextMonthPrograms.push(program);
            } else if (
                startDate.getMonth() === monthAfterNext &&
                startDate.getFullYear() === monthAfterNextYear
            ) {
                monthAfterNextPrograms.push(program);
            } else if (startDate > now) {
                comingSoon.push(program);
            }
        });

        return {
            completedPrograms: sortPrograms(completedPrograms, sortBy),
            pastPrograms: sortPrograms(pastPrograms, sortBy),
            upcoming: sortPrograms(upcoming, sortBy),
            thisMonth: sortPrograms(thisMonth, sortBy),
            nextMonthPrograms: sortPrograms(nextMonthPrograms, sortBy),
            monthAfterNextPrograms: sortPrograms(monthAfterNextPrograms, sortBy),
            comingSoon: sortPrograms(comingSoon, sortBy),
        };
    }

    console.log("DEBUG FEEDINGS:", feedings);

    const programsWithLocalPin = (Array.isArray(feedings) ? feedings : []).map((p) => ({
    ...p,
    pinned: localPinnedState[p._id!] ?? p.pinned,
}));

    function resetModalState() {
        setIsModalOpen(false);
        setIsEdit(false);
        setIsAdd(false);
        setEditData(null);
    }

    const unpinnedPrograms = filteredAndSortedFeedings.filter((p) => !p.pinned);
    const categorizedPrograms = categorizePrograms(unpinnedPrograms, sortBy);

    async function handleStatusChange(program: Feeding, newStatus: Feeding["status"]) {
        try {
            await saveFeedingProgram({ ...program, status: newStatus });
            mutate("/api/feeding");
        } catch (err) {
            console.error("Failed to update status", err);
        }
    }

    async function togglePin(program: Feeding, pinned: boolean) {
        const id = program._id!;
        setLocalPinnedState((prev) => ({ ...prev, [id]: pinned }));

        try {
            await saveFeedingProgram({ ...program, pinned });
            mutate("/api/feeding");
        } catch (err) {
            console.error("Failed to toggle pin", err);
            setLocalPinnedState((prev) => ({ ...prev, [id]: !pinned }));
        }
    }

    async function handleDelete(program: Feeding) {
        if (!program._id) {
            console.error("No _id found on program", program);
            return;
        }

        if (window.confirm(`Are you sure you want to delete "${program.name}"?`)) {
            try {
                await deleteFeedingProgram(program._id);
                mutate("/api/feeding");
            } catch (err) {
                console.error("Failed to delete program", err);
            }
        }
    }

    function handleEdit(program: Feeding) {
        setEditData(program);
        setIsEdit(true);
        setIsModalOpen(true);
    }

    function clearFilters() {
        setSearchTerm("");
        setStatusFilter("all");
        setDateRangeStart("");
        setDateRangeEnd("");
        setSortBy("date_started_desc");
    }

    function renderProgramSection(title: string, programs: Feeding[]) {
        if (programs.length === 0) return null;

        return (
            <>
                <h2 className={styles.subheading}>{title}</h2>
                <div className={styles.cardGrid}>
                    {programs.map((program) => (
                        <FeedingCard
                            key={program._id}
                            program={program}
                            onCardClick={router.push}
                            onStatusChange={handleStatusChange}
                            onTogglePin={togglePin}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            </>
        );
    }

    const sectionOrder = useMemo(() => {
        const usingDateFilter = dateRangeStart || dateRangeEnd;
        if (usingDateFilter || !["date_started", "date_started_desc"].includes(sortBy)) {
            return [
                {
                    title: "All Programs",
                    data: filteredAndSortedFeedings,
                },
            ];
        }

        const baseSections = {
            Upcoming: categorizedPrograms.upcoming,
            "This Month": categorizedPrograms.thisMonth,
            [`${monthNames[nextMonth]} ${nextMonthYear}`]: categorizedPrograms.nextMonthPrograms,
            [`${monthNames[monthAfterNext]} ${monthAfterNextYear}`]:
                categorizedPrograms.monthAfterNextPrograms,
            "Coming Soon": categorizedPrograms.comingSoon,
            "Past Programs": categorizedPrograms.pastPrograms,
            "Completed Programs": categorizedPrograms.completedPrograms,
        };

        if (sortBy === "date_started_desc") {
            return [
                { title: "Upcoming", data: baseSections.Upcoming },
                { title: "This Month", data: baseSections["This Month"] },
                {
                    title: `${monthNames[nextMonth]} ${nextMonthYear}`,
                    data: baseSections[`${monthNames[nextMonth]} ${nextMonthYear}`],
                },
                {
                    title: `${monthNames[monthAfterNext]} ${monthAfterNextYear}`,
                    data: baseSections[`${monthNames[monthAfterNext]} ${monthAfterNextYear}`],
                },
                { title: "Coming Soon", data: baseSections["Coming Soon"] },
                { title: "Past Programs", data: baseSections["Past Programs"] },
                { title: "Completed Programs", data: baseSections["Completed Programs"] },
            ];
        }

        return [
            { title: "Coming Soon", data: baseSections["Coming Soon"] },
            {
                title: `${monthNames[monthAfterNext]} ${monthAfterNextYear}`,
                data: baseSections[`${monthNames[monthAfterNext]} ${monthAfterNextYear}`],
            },
            {
                title: `${monthNames[nextMonth]} ${nextMonthYear}`,
                data: baseSections[`${monthNames[nextMonth]} ${nextMonthYear}`],
            },
            { title: "This Month", data: baseSections["This Month"] },
            { title: "Upcoming", data: baseSections.Upcoming },
            { title: "Past Programs", data: baseSections["Past Programs"] },
            { title: "Completed Programs", data: baseSections["Completed Programs"] },
        ];
    }, [
        categorizedPrograms,
        filteredAndSortedFeedings,
        sortBy,
        dateRangeStart,
        dateRangeEnd,
        monthNames,
        nextMonth,
        nextMonthYear,
        monthAfterNext,
        monthAfterNextYear,
    ]);

    return (
        <div className={styles.feedingTab}>
            <div className={styles.header}>
                <h1 className={styles.heading}>Feeding</h1>
                <SectionExportButton type="feeding" label="Export CSV" />
            </div>

            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Search:</label>
                        <input
                            type="text"
                            placeholder="Search by program name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}>
                            <option value="all">All Statuses</option>
                            {FeedingProgramStatus.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Start Date From:</label>
                        <input
                            type="date"
                            value={dateRangeStart}
                            onChange={(e) => setDateRangeStart(e.target.value)}
                            className={styles.dateInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Start Date To:</label>
                        <input
                            type="date"
                            value={dateRangeEnd}
                            onChange={(e) => setDateRangeEnd(e.target.value)}
                            className={styles.dateInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <button onClick={clearFilters} className={styles.clearButton}>
                            Clear Filters
                        </button>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={styles.filterSelect}>
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.headerActions}>
                <div className={styles.resultsInfo}>
                    Showing {filteredAndSortedFeedings.length} of {Array.isArray(feedings) ? feedings.length : 0} programs
                </div>
                <button
                    onClick={() => {
                        setIsAdd(true);
                        setIsEdit(false);
                        setEditData(null);
                        setIsModalOpen(true);
                    }}
                    className={styles.addButton}>
                    + Add Program
                </button>
            </div>

            {pinnedPrograms.length > 0 && (
                <>
                    <h2 className={styles.subheading}>Pinned Programs</h2>
                    <div className={styles.cardGrid}>
                        {pinnedPrograms.map((program) => (
                            <FeedingCard
                                key={program._id}
                                program={program}
                                onCardClick={router.push}
                                onStatusChange={handleStatusChange}
                                onTogglePin={togglePin}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                </>
            )}

            {sectionOrder.map((section) => (
                <React.Fragment key={section.title}>
                    {renderProgramSection(section.title, section.data)}
                </React.Fragment>
            ))}

            <FeedingModal
                isOpen={isModalOpen}
                onCloseAction={resetModalState}
                feeding={editData || initialFeedingProgram}
                isAdd={isAdd}
            />
        </div>
    );
}

function FeedingCard({
    program,
    onCardClick,
    onStatusChange,
    onTogglePin,
    onDelete,
    onEdit,
}: {
    program: Feeding;
    onCardClick: (url: string) => void;
    onStatusChange: (program: Feeding, status: Feeding["status"]) => void;
    onTogglePin: (program: Feeding, pinned: boolean) => void;
    onDelete: (program: Feeding) => void;
    onEdit: (program: Feeding) => void;
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    return (
        <div className={styles.card} onClick={() => onCardClick(`/dashboard/feeding/${program._id}`)}>
            <div className={styles.cardHeader}>
                <div className={styles.titleSection}>
                    <h3 className={styles.cardTitle}>{program.name}</h3>
                    {program.description && (
                        <div className={styles.descriptionContainer}>
                            <p
                                className={`${styles.cardDescription} ${
                                    showFullDescription ? styles.expanded : ""
                                }`}>
                                {program.description}
                            </p>
                            {program.description.length > 100 && (
                                <button
                                    className={styles.seeMoreButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowFullDescription(!showFullDescription);
                                    }}>
                                    {showFullDescription ? "See less" : "See more"}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.cardActions}>
                    <button
                        className={`${styles.pinButton} ${program.pinned ? styles.pinned : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(program, !program.pinned);
                        }}
                        title={program.pinned ? "Unpin" : "Pin"}>
                        📌
                    </button>

                    <div className={styles.dropdown} ref={dropdownRef}>
                        <button
                            className={styles.dropdownButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(!showDropdown);
                            }}>
                            ⋮
                        </button>

                        {showDropdown && (
                            <div className={styles.dropdownMenu}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(program);
                                        setShowDropdown(false);
                                    }}
                                    className={styles.dropdownItem}>
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(program);
                                        setShowDropdown(false);
                                    }}
                                    className={`${styles.dropdownItem} ${styles.deleteItem}`}>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div
                className={styles.cardContent}
                onClick={() => onCardClick(`/dashboard/feeding/${program._id}`)}>
                <div className={styles.dateSection}>
                    <div className={styles.dateItem}>
                        <span className={styles.dateLabel}>Start:</span>
                        <span className={styles.dateValue}>
                            {new Date(program.date_started).toLocaleDateString("en-US", {
                                dateStyle: "medium",
                            })}
                        </span>
                    </div>
                    <div className={styles.dateItem}>
                        <span className={styles.dateLabel}>End:</span>
                        <span className={styles.dateValue}>
                            {program.date_ended
                                ? new Date(program.date_ended).toLocaleDateString("en-US", {
                                      dateStyle: "medium",
                                  })
                                : "N/A"}
                        </span>
                    </div>
                </div>

                <div className={styles.beneficiariesSection}>
                    <span className={styles.beneficiariesLabel}>Total Beneficiaries:</span>
                    <span className={styles.beneficiariesValue}>
                        {program.beneficiaries?.length || "N/A"}
                    </span>
                </div>

                <div className={styles.metaSection}>
                    <p className={styles.lastModified}>
                        Last Modified:{" "}
                        {new Date(program?.last_modified || "").toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    </p>
                </div>

                <div className={styles.statusSection} onClick={(e) => e.stopPropagation()}>
                    <label className={styles.statusLabel}>Status:</label>
                    <select
                        value={program.status}
                        onChange={(e) => onStatusChange(program, e.target.value as Feeding["status"])}
                        className={`${styles.statusSelect} ${
                            styles[program.status.toLowerCase().replace(/\s+/g, "")]
                        }`}>
                        {FeedingProgramStatus.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

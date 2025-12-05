"use client";
import React, { useState, useRef, useEffect } from "react";
import { mutate } from "swr";
import styles from "@/styles/members.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { deleteHousehold } from "@/lib/api/households";
import { Household } from "@/types/households";
import HouseholdModal from "./createNew";
import { unique } from "next/dist/build/utils";
import SectionExportButton from "@/app/components/SectionExportButton";

const initialHousehold: Household = {
    name: "",
    head: undefined,
    cluster: "",
    ownership: "",
    hoa_last_reached_out: "",
    hoa_status: "",
    members: [],
};

export default function HouseholdsTab() {
    const { households, members, interventions } = useDashboardData();
    const [error, setError] = useState<string | null>(null);
    const [isAdd, setIsAdd] = useState(false);
    const [showHouseholdModal, setShowHouseholdModal] = useState(false);
    const tempIdRef = useRef(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [householdFilter, setHouseholdFilter] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Household | null;
        direction: "asc" | "desc";
    }>({
        key: null,
        direction: "asc",
    });
    const [selectedHousehold, setSelectedHousehold] = useState<Household | undefined>(undefined);
    const [selectedRow, setSelectedRow] = useState<Household | undefined>(undefined);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        cluster: "",
        ownership: "",
        hoa_status: "",
    });

    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;

    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const householdsElement = document.getElementById("households");

            if (householdsElement && !householdsElement.contains(event.target as Node)) {
                setSelectedRow(undefined);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (filteredHouseholds.length === 0) {
            setCurrentPage(0);
        } else {
            setCurrentPage(1);
        }
    }, [searchTerm, householdFilter, households]);

    const filteredHouseholds = households
        .filter((row: Household) => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                row.name.toLowerCase().includes(search) ||
                `${row.head?.last_name ?? ""}, ${row.head?.first_name ?? ""}`
                    .toLowerCase()
                    .includes(search) ||
                row.members?.length.toString().includes(search);

            const matchesCluster = filters.cluster ? row.cluster === filters.cluster : true;
            const matchesOwnership = filters.ownership ? row.ownership === filters.ownership : true;
            const matchesHOAStatus = filters.hoa_status ? row.hoa_status === filters.hoa_status : true;

            const hoaDate = row.hoa_last_reached_out ? new Date(row.hoa_last_reached_out) : null;
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            const matchesDateRange =
                (!startDate || (hoaDate && hoaDate >= startDate)) &&
                (!endDate || (hoaDate && hoaDate <= endDate));

            return (
                matchesSearch && matchesCluster && matchesOwnership && matchesHOAStatus && matchesDateRange
            );
        })
        .sort((a, b) => {
            const { key, direction } = sortConfig;
            if (!key) return 0;

            const getValue = (household: Household) => {
                if (key === "head") {
                    return household.head ? `${household.head.last_name}, ${household.head.first_name}` : "";
                }
                const val = household[key];
                return typeof val === "string" ? val : val?.toString() ?? "";
            };

            const valA = getValue(a);
            const valB = getValue(b);

            return direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });

    const totalPages = Math.ceil(filteredHouseholds.length / rowsPerPage);
    const paginatedHouseholds = filteredHouseholds.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    async function handleDelete() {
        if (!selectedRow) return null;
        try {
            await deleteHousehold(selectedRow);

            mutate("/api/household");
            setSelectedRow(undefined);
            setSelectedHousehold(undefined);
        } catch (err: any) {
            setError(err.message);
        }
    }

    function handleAddHouseholdRow() {
        const tempId = `new-${tempIdRef.current++}`;
        const newHousehold: Household & { _isNew?: boolean } = {
            ...initialHousehold,
            _isNew: true,
            _id: tempId,
        };
        setSelectedHousehold(newHousehold);
        setIsAdd(true);

        setShowHouseholdModal(true);
    }

    function handleView() {
        if (!selectedRow) return;
        setSelectedHousehold(selectedRow);
        setShowHouseholdModal(true);
        setIsAdd(false);
    }

    function handleEdit() {
        setIsAdd(false);
        setShowHouseholdModal(true);
    }

    function resetModalState() {
        setIsAdd(false);
        setShowHouseholdModal(false);
    }

    const resetFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            cluster: "",
            ownership: "",
            hoa_status: "",
        });
        setSearchTerm("");
        setSortConfig({ key: null, direction: "asc" });
    };

    const handleSort = (key: keyof Household) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    function renderSortIndicator(key: keyof Household) {
        if (sortConfig?.key !== key) return null;
        return sortConfig.direction === "asc" ? " ▲" : " ▼";
    }

    function renderTableHeader(key: keyof Household, label: string) {
        return (
            <th onClick={() => handleSort(key)}>
                {label}
                {renderSortIndicator(key)}
            </th>
        );
    }

    function renderTableRow(row: Household) {
        const rowKey = row._id || (row as any).id || (row as any).tempId || JSON.stringify(row);
        return (
            <tr
                key={rowKey}
                onClick={() => setSelectedRow(row)}
                onDoubleClick={() => handleView()}
                className={selectedRow?._id === row._id ? styles.selectedRow : ""}>
                <td>{row.name}</td>
                <td>{row.head ? `${row.head.last_name}, ${row.head.first_name}` : ""}</td>

                <td>{row.cluster}</td>
                <td>{row.ownership}</td>
                <td>
                    {" "}
                    {row.hoa_last_reached_out
                        ? new Date(row.hoa_last_reached_out).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                          })
                        : ""}
                </td>
                <td>{row.hoa_status}</td>
                <td>{row.members?.length || 0}</td>
            </tr>
        );
    }

    return (
        <section className={styles.pageSection}>
            <div className={styles.header}>
                <h2 className={styles.pageTitle}>Households</h2>
                <SectionExportButton type="households" label="Export CSV" />
            </div>

            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Search</label>
                        <input
                            type="text"
                            placeholder="Search name, head, or count..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Cluster</label>
                        <select
                            value={filters.cluster}
                            onChange={(e) => setFilters((f) => ({ ...f, cluster: e.target.value }))}
                            className={styles.searchInput}>
                            <option value="">All</option>
                            {["Cluster 1", "Cluster 2", "Cluster 3", "Cluster 4", "Cluster 5"].map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Ownership</label>
                        <select
                            value={filters.ownership}
                            onChange={(e) => setFilters((f) => ({ ...f, ownership: e.target.value }))}
                            className={styles.searchInput}>
                            <option value="">All</option>
                            {["RENT", "OWNED"].map((o) => (
                                <option key={o} value={o}>
                                    {o}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>HOA Status</label>
                        <select
                            value={filters.hoa_status}
                            onChange={(e) => setFilters((f) => ({ ...f, hoa_status: e.target.value }))}
                            className={styles.searchInput}>
                            <option value="">All</option>
                            {[
                                "CONNECTED",
                                "1ST",
                                "2ND",
                                "3RD",
                                "4TH",
                                "5TH",
                                "6TH",
                                "7TH",
                                "8TH",
                                "9TH",
                                "10TH",
                            ].map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <button onClick={resetFilters} className={styles.clearButton}>
                            Clear Filters
                        </button>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>HOA Reached: From</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>HOA Reached: To</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
  <label className={styles.filterLabel}>
    NOTE: To update a head, you must add a member to a household.
  </label>
</div>
                </div>
            </div>

            <div className={styles.memberHeader}>
                <div className={styles.resultsInfo}>
        Showing {paginatedHouseholds.length} of {filteredHouseholds.length} households
      </div>
                <div className={styles.paginationWrapper}>
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1}
                        className={styles.paganationButton}>
                        &lt;
                    </button>
                    <span className={styles.paginationText}>
                        {totalPages > 0 ? `PAGE ${currentPage} OF ${totalPages}` : "NO RESULTS"}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={styles.paganationButton}>
                        &gt;
                    </button>
                </div>
                <div style={{ display: "flex", gap: 8 }} id="households" ref={sectionRef}>
                    <button className={styles.addButton} onClick={handleAddHouseholdRow} disabled={isAdd}>
                        Add
                    </button>

                    {/* {<button
            className={styles.editButton}
            disabled={!selectedRow}
            onClick={handleEdit}
          >
            Edit
          </button>} */}
                    <button className={styles.deleteButton} disabled={!selectedRow} onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </div>

            <div className={styles.previewTableWrapper} id="households" ref={sectionRef}>
                <table className={styles.tableSmall}>
                    <thead>
                        <tr>
                            {renderTableHeader("name", "Name")}
                            {renderTableHeader("head", "Head")}
                            {renderTableHeader("cluster", "Cluster")}
                            {renderTableHeader("ownership", "Ownership")}
                            {renderTableHeader("hoa_last_reached_out", "HOA Last Reach")}
                            {renderTableHeader("hoa_status", "HOA Status")}
                            {renderTableHeader("members", "Head Count")}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedHouseholds.map((row: Household) => renderTableRow(row))}
                        {filteredHouseholds.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{ textAlign: "center" }}>
                                    No households found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <HouseholdModal
                    isOpen={showHouseholdModal}
                    onCloseAction={resetModalState}
                    isAdd={isAdd}
                    household={selectedHousehold || initialHousehold}
                />
            </div>
        </section>
    );
}

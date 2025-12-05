"use client";
import React, { useState, useRef, useEffect } from "react";
import { mutate } from "swr";
import styles from "@/styles/members.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { deleteMember } from "@/lib/api/members";
import { Member } from "@/types/members";
import { Household } from "@/types/households";
import MemberModal from "./createNew";
import { unique } from "next/dist/build/utils";
import SectionExportButton from "@/app/components/SectionExportButton";

export const initialMember: Member = {
    last_name: "",
    first_name: "",
    sex: "",
    birthdate: "",
    weight: "",
    contact_number: "",
    marital_status: "Single",
    partner: undefined,
    occupation: "Unemployed",
    guardians: [],
    household: undefined,
    general_notes: "",
    sensitive_notes: "",
};

export default function MembersTab() {
    const { households, members } = useDashboardData();
    const [error, setError] = useState<string | null>(null);
    const [isAdd, setIsAdd] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const tempIdRef = useRef(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [householdFilter, setHouseholdFilter] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Member | null;
        direction: "asc" | "desc";
    }>({
        key: null,
        direction: "asc",
    });
    const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
    const [selectedRow, setSelectedRow] = useState<Member | undefined>(undefined);
    const [filters, setFilters] = useState({
        sex: "",
        minAge: "",
        maxAge: "",
        minWeight: "",
        maxWeight: "",
        maritalStatus: "",
        household: "",
    });

    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;

    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const membersElement = document.getElementById("members");

            if (membersElement && !membersElement.contains(event.target as Node)) {
                setSelectedRow(undefined);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (filteredMembers.length === 0) {
            setCurrentPage(0);
        } else {
            setCurrentPage(1);
        }
    }, [searchTerm, householdFilter, members]);

    const filteredMembers = members
        .filter((row: Member) => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                row.first_name?.toLowerCase().includes(search) ||
                row.last_name?.toLowerCase().includes(search) ||
                row.contact_number?.toLowerCase().includes(search) ||
                row.occupation?.toLowerCase().includes(search);

            const matchesSex = !filters.sex || row.sex === filters.sex;
            const matchesMarital = !filters.maritalStatus || row.marital_status === filters.maritalStatus;
            const matchesHousehold = !filters.household || row.household?._id === filters.household;

            const birthdate = row.birthdate ? new Date(row.birthdate) : null;
            const age = birthdate
                ? Math.floor((Date.now() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                : null;
            const matchesAge =
                (!filters.minAge || (age !== null && age >= +filters.minAge)) &&
                (!filters.maxAge || (age !== null && age <= +filters.maxAge));

            const weight = parseFloat(row.weight || "0");
            const matchesWeight =
                (!filters.minWeight || weight >= +filters.minWeight) &&
                (!filters.maxWeight || weight <= +filters.maxWeight);

            return (
                matchesSearch &&
                matchesSex &&
                matchesMarital &&
                matchesHousehold &&
                matchesAge &&
                matchesWeight
            );
        })
        .sort((a, b) => {
            const { key, direction } = sortConfig;
            if (!key) return 0;

            const getValue = (member: Member) => {
                if (key === "partner") {
                    return member.partner ? `${member.partner.last_name}, ${member.partner.first_name}` : "";
                }
                const val = member[key];
                return typeof val === "string" ? val : val?.toString() ?? "";
            };

            const valA = getValue(a);
            const valB = getValue(b);
            return direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });

    const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    async function handleDelete() {
        if (!selectedRow) return null;
        try {
            await deleteMember(selectedRow);

            mutate("/api/member");
            mutate("/api/household");
            setSelectedRow(undefined);
            setSelectedMember(undefined);
        } catch (err: any) {
            setError(err.message);
        }
    }

    function handleAddMemberRow() {
        const tempId = `new-${tempIdRef.current++}`;
        const newMember: Member & { _isNew?: boolean } = {
            ...initialMember,
            _isNew: true,
            _id: tempId,
        };
        setSelectedMember(newMember);
        setIsAdd(true);

        setShowMemberModal(true);
    }

    function handleView() {
        if (!selectedRow) return;
        setSelectedMember(selectedRow);
        setShowMemberModal(true);
        setIsAdd(false);
    }

    function handleEdit() {
        setIsAdd(false);
        setShowMemberModal(true);
    }

    function resetModalState() {
        setIsAdd(false);
        setShowMemberModal(false);
    }

    const resetFilters = () => {
        setFilters({
            sex: "",
            minAge: "",
            maxAge: "",
            minWeight: "",
            maxWeight: "",
            maritalStatus: "",
            household: "",
        });
        setSearchTerm("");
        setSortConfig({ key: null, direction: "asc" });
    };

    const handleSort = (key: keyof Member) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    function renderSortIndicator(key: keyof Member) {
        if (sortConfig?.key !== key) return null;
        return sortConfig.direction === "asc" ? " ▲" : " ▼";
    }

    function renderTableHeader(key: keyof Member, label: string) {
        return (
            <th onClick={() => handleSort(key)}>
                {label}
                {renderSortIndicator(key)}
            </th>
        );
    }

    function renderTableRow(row: Member) {
        const rowKey = row._id || (row as any).id || (row as any).tempId || JSON.stringify(row);
        return (
            <tr
                key={rowKey}
                onClick={() => setSelectedRow(row)}
                onDoubleClick={() => handleView()}
                className={selectedRow === row ? styles.selectedRow : ""}>
                <td>{row.first_name}</td>
                <td>{row.last_name}</td>
                <td>{row.sex}</td>
                <td>
                    {row.birthdate
                        ? new Date(row.birthdate).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                          })
                        : "N/A"}
                </td>
                <td>{row.weight}</td>
                <td>{row.contact_number}</td>
                <td>{row.household?.name}</td>
                <td>{row.marital_status}</td>
                <td>{row.occupation}</td>
            </tr>
        );
    }

    return (
        <section className={styles.pageSection}>
            <div className={styles.header}>
                <h2 className={styles.pageTitle}>Members</h2>
                <SectionExportButton type="members" label="Export CSV" />
            </div>

            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Search</label>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Sex</label>
                        <select
                            value={filters.sex}
                            onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
                            className={styles.searchInput}>
                            <option value="">All</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Age: From</label>
                        <input
                            type="number"
                            placeholder="Min"
                            className={styles.searchInput}
                            value={filters.minAge}
                            onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Age: To</label>
                        <input
                            type="number"
                            placeholder="Max"
                            className={styles.searchInput}
                            value={filters.maxAge}
                            onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <button onClick={resetFilters} className={styles.clearButton}>
                            Clear Filters
                        </button>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Weight: From</label>

                        <input
                            type="number"
                            placeholder="Min"
                            className={styles.searchInput}
                            value={filters.minWeight}
                            onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Weight: To</label>
                        <input
                            type="number"
                            placeholder="Max"
                            className={styles.searchInput}
                            value={filters.maxWeight}
                            onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Household</label>
                        <select
                            value={filters.household}
                            onChange={(e) => setFilters({ ...filters, household: e.target.value })}
                            className={styles.searchInput}>
                            <option value="">All</option>
                            {households.map((hh: Household) => (
                                <option key={hh._id} value={hh._id}>
                                    {hh.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Marital Status</label>
                        <select
                            value={filters.maritalStatus}
                            onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
                            className={styles.searchInput}>
                            <option value="">All</option>
                            <option value="Single">Single</option>
                            <option value="Single Parent">Single Parent</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                            <option value="Partnered">Partnered</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.memberHeader}>

                <div className={styles.resultsInfo}>
        Showing {paginatedMembers.length} of {filteredMembers.length} members
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
                <div style={{ display: "flex", gap: 8 }} id="members" ref={sectionRef}>
                    <button className={styles.addButton} onClick={handleAddMemberRow} disabled={isAdd}>
                        Add
                    </button>
                    {/* <button
            className={styles.editButton}
            disabled={!selectedRow}
            onClick={handleEdit}
          >
            Edit
          </button> */}
                    <button className={styles.deleteButton} disabled={!selectedRow} onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </div>

            <div className={styles.previewTableWrapper} id="members" ref={sectionRef}>
                <table className={styles.tableSmall}>
                    <thead>
                        <tr>
                            {renderTableHeader("first_name", "First Name")}
                            {renderTableHeader("last_name", "Last Name")}
                            {renderTableHeader("sex", "Sex")}
                            {renderTableHeader("birthdate", "Birthdate")}
                            {renderTableHeader("weight", "Weight")}
                            {renderTableHeader("contact_number", "Contact #")}
                            {renderTableHeader("household", "Household")}
                            {renderTableHeader("marital_status", "Marital Status")}
                            {renderTableHeader("occupation", "Occupation")}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMembers.map((row: Member) => renderTableRow(row))}
                        {filteredMembers.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{ textAlign: "center" }}>
                                    No members found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <MemberModal
                    isOpen={showMemberModal}
                    onCloseAction={resetModalState}
                    isAdd={isAdd}
                    member={selectedMember || initialMember}
                />
            </div>
        </section>
    );
}

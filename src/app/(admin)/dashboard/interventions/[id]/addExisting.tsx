"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./addExisting.module.css";
import { Household } from "@/types/households";
import { CLUSTER_OPTIONS } from "@/types/households";
import { useDashboardData } from "@/utils/DashboardContext";
import { mutate } from "swr";
import useSWR from "swr";

type AddExistingProps = {
    isOpen: boolean;
    onCloseAction: () => void;
};

enum BeneficiaryTab {
    MEMBER = "MEMBER",
    HOUSEHOLD = "HOUSEHOLD",
    CLUSTER = "CLUSTER",
}

export function useinterventionById(id: string) {
    return useSWR(id ? `/api/intervention/${id}` : null, (url) => fetch(url).then((res) => res.json()));
}

export default function AddExistingModal({ isOpen, onCloseAction }: AddExistingProps) {
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : "";
    const { members, households } = useDashboardData();
    const currentIntervention = useinterventionById(id);

    const [activeTab, setActiveTab] = useState<BeneficiaryTab>(BeneficiaryTab.MEMBER);
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    const [filters, setFilters] = useState({
        searchName: "",
        minAge: "",
        maxAge: "",
        minWeight: "",
        maxWeight: "",
    });

    // Remove the useEffect that depended on beneficiaryType prop
    useEffect(() => {
        // Reset selected items when switching tabs
        setSelectedItems(new Set());
    }, [activeTab]);

    const calculateAge = (birthdate: string) => {
        if (!birthdate) return null;
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getFilteredItems = () => {
        if (activeTab === BeneficiaryTab.MEMBER) {
            // Use members from context instead of membersRows
            if (!members) return [];

            const existingBeneficiaries = currentIntervention?.data?.beneficiaries_member || [];

            return members.filter((member) => {
                // Exclude existing beneficiaries
                if (existingBeneficiaries.includes(member._id)) return false;

                const age = calculateAge(member.birthdate);

                if (filters.minAge && age !== null && age < parseInt(filters.minAge)) return false;
                if (filters.maxAge && age !== null && age > parseInt(filters.maxAge)) return false;

                const weight = parseFloat(member.weight);
                if (filters.minWeight && (!weight || weight < parseFloat(filters.minWeight))) return false;
                if (filters.maxWeight && (!weight || weight > parseFloat(filters.maxWeight))) return false;

                if (filters.searchName) {
                    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
                    if (!fullName.includes(filters.searchName.toLowerCase())) return false;
                }

                return true;
            });
        } else if (activeTab === BeneficiaryTab.HOUSEHOLD) {
            if (!households) return [];

            const existingBeneficiaries = currentIntervention?.data?.beneficiaries_household || [];

            return households.filter((household: Household) => {
                // Exclude existing beneficiaries
                if (existingBeneficiaries.includes(household._id)) return false;

                if (filters.searchName) {
                    const householdName = household.name?.toLowerCase() || "";
                    if (!householdName.includes(filters.searchName.toLowerCase())) return false;
                }

                return true;
            });
        } else if (activeTab === BeneficiaryTab.CLUSTER) {
            const existingBeneficiaries = currentIntervention?.data?.beneficiaries_cluster || [];

            return CLUSTER_OPTIONS.filter((cluster) => {
                // Exclude existing beneficiaries
                if (existingBeneficiaries.includes(cluster)) return false;

                if (filters.searchName) {
                    const clusterName = cluster.toLowerCase();
                    if (!clusterName.includes(filters.searchName.toLowerCase())) return false;
                }

                return true;
            });
        }

        return [];
    };

    const filteredItems = getFilteredItems();

    const addBeneficiary = async (itemId: string) => {
        if (!currentIntervention?.data?._id) return;

        try {
            setIsProcessing(true);

            const interventionId = currentIntervention.data._id;
            const payload: any = {};

            if (activeTab === BeneficiaryTab.MEMBER) {
                payload.addMemberId = itemId;
            } else if (activeTab === BeneficiaryTab.HOUSEHOLD) {
                payload.addHouseholdId = itemId;
            } else if (activeTab === BeneficiaryTab.CLUSTER) {
                payload.addClusterId = itemId;
            }

            const response = await fetch(`/api/intervention/${interventionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to add beneficiary");
            }

            mutate(`/api/intervention/${interventionId}`);
            mutate("/api/intervention");
        } catch (error) {
            console.error("Error adding beneficiary:", error);
            alert("Failed to add beneficiary. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const addMultipleBeneficiaries = async (itemIds: string[]) => {
        if (!currentIntervention?.data?._id || itemIds.length === 0) return;

        try {
            setIsProcessing(true);

            for (const itemId of itemIds) {
                await addBeneficiary(itemId);
            }
        } catch (error) {
            console.error("Error adding multiple beneficiaries:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            searchName: "",
            minAge: "",
            maxAge: "",
            minWeight: "",
            maxWeight: "",
        });
    };

    const handleItemSelect = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            const allIds = filteredItems.map((item: any) =>
                activeTab === BeneficiaryTab.CLUSTER ? item : item._id
            );
            setSelectedItems(new Set(allIds));
        }
    };

    const handleAddSelected = () => {
        if (selectedItems.size > 0) {
            addMultipleBeneficiaries(Array.from(selectedItems));
            setSelectedItems(new Set());
            onCloseAction();
        }
    };

    const renderTableRow = (item: any) => {
        const itemId = activeTab === BeneficiaryTab.CLUSTER ? item : item._id;
        const isSelected = selectedItems.has(itemId);

        if (activeTab === BeneficiaryTab.MEMBER) {
            const age = calculateAge(item.birthdate);
            return (
                <tr key={item._id}>
                    {multiSelectMode && (
                        <td>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleItemSelect(item._id)}
                                className={styles.checkboxInput}
                                aria-label={`Select ${item.first_name} ${item.last_name}`}
                            />
                        </td>
                    )}
                    <td>
                        <div className={styles.memberInfo}>
                            <div className={styles.memberMainName}>
                                {item.first_name} {item.last_name}
                            </div>
                            {item.marital_status && (
                                <div className={styles.memberSubInfo}>{item.marital_status}</div>
                            )}
                        </div>
                    </td>
                    <td>{age !== null ? `${age} years` : "N/A"}</td>
                    <td>{item.sex || "N/A"}</td>
                    <td>{item.weight ? `${item.weight} kg` : "N/A"}</td>
                    <td>{item.contact_number || "N/A"}</td>
                    <td>{item.household ? item.household.name : "N/A"}</td>
                    {!multiSelectMode && (
                        <td>
                            <button
                                onClick={async () => {
                                    await addBeneficiary(item._id);
                                    onCloseAction();
                                }}
                                className={styles.addSingleBtn}
                                disabled={isProcessing}
                                aria-label={`Add ${item.first_name} ${item.last_name} to the intervention`}>
                                {isProcessing ? "..." : "Add"}
                            </button>
                        </td>
                    )}
                </tr>
            );
        } else if (activeTab === BeneficiaryTab.HOUSEHOLD) {
            return (
                <tr key={item._id}>
                    {multiSelectMode && (
                        <td>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleItemSelect(item._id)}
                                className={styles.checkboxInput}
                                aria-label={`Select ${item.name}`}
                            />
                        </td>
                    )}
                    <td>
                        <div className={styles.memberInfo}>
                            <div className={styles.memberMainName}>{item.name}</div>
                        </div>
                    </td>
                    <td>{item.address || "N/A"}</td>
                    <td>{item.members?.length || 0} members</td>
                    <td colSpan={3}></td>
                    {!multiSelectMode && (
                        <td>
                            <button
                                onClick={async () => {
                                    await addBeneficiary(item._id);
                                    onCloseAction();
                                }}
                                className={styles.addSingleBtn}
                                disabled={isProcessing}
                                aria-label={`Add ${item.name} to the intervention`}>
                                {isProcessing ? "..." : "Add"}
                            </button>
                        </td>
                    )}
                </tr>
            );
        } else if (activeTab === BeneficiaryTab.CLUSTER) {
            return (
                <tr key={item}>
                    {multiSelectMode && (
                        <td>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleItemSelect(item)}
                                className={styles.checkboxInput}
                                aria-label={`Select ${item}`}
                            />
                        </td>
                    )}
                    <td>
                        <div className={styles.memberInfo}>
                            <div className={styles.memberMainName}>{item}</div>
                        </div>
                    </td>
                    <td colSpan={5}></td>
                    {!multiSelectMode && (
                        <td>
                            <button
                                onClick={async () => {
                                    await addBeneficiary(item);
                                    onCloseAction();
                                }}
                                className={styles.addSingleBtn}
                                disabled={isProcessing}
                                aria-label={`Add ${item} to the intervention`}>
                                {isProcessing ? "..." : "Add"}
                            </button>
                        </td>
                    )}
                </tr>
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onCloseAction()}>
            <div
                className={styles.modalContent}
                role="dialog"
                aria-labelledby="modal-title"
                aria-modal="true">
                <h3 id="modal-title" className={styles.modalTitle}>
                    Add {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Beneficiaries
                </h3>

                {/* Beneficiary Type Selection Buttons */}
                <div className={styles.beneficiaryTypeSelection}>
                    <h4>Select Beneficiary Type</h4>
                    <div className={styles.typeButtonGroup}>
                        <button
                            className={`${styles.typeButton} ${
                                activeTab === BeneficiaryTab.MEMBER ? styles.activeTypeButton : ""
                            }`}
                            onClick={() => setActiveTab(BeneficiaryTab.MEMBER)}>
                            Member
                        </button>
                        <button
                            className={`${styles.typeButton} ${
                                activeTab === BeneficiaryTab.HOUSEHOLD ? styles.activeTypeButton : ""
                            }`}
                            onClick={() => setActiveTab(BeneficiaryTab.HOUSEHOLD)}>
                            Household
                        </button>
                        <button
                            className={`${styles.typeButton} ${
                                activeTab === BeneficiaryTab.CLUSTER ? styles.activeTypeButton : ""
                            }`}
                            onClick={() => setActiveTab(BeneficiaryTab.CLUSTER)}>
                            Cluster
                        </button>
                    </div>
                </div>

                <div className={styles.selectionModeToggle}>
                    <label className={styles.toggleSwitch}>
                        <input
                            type="checkbox"
                            checked={multiSelectMode}
                            onChange={(e) => {
                                setMultiSelectMode(e.target.checked);
                                setSelectedItems(new Set());
                            }}
                            className={styles.toggleInput}
                        />
                        <span className={styles.toggleSlider}></span>
                    </label>
                    <span className={styles.toggleLabel}>
                        {multiSelectMode ? "Multiple Selection Mode" : "Single Selection Mode"}
                    </span>
                </div>

                <div className={styles.filterSection}>
                    <h4>Filters</h4>
                    <div className={styles.filterGrid}>
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel} htmlFor="search-name">
                                Search Name
                            </label>
                            <input
                                id="search-name"
                                type="text"
                                placeholder="Enter name..."
                                value={filters.searchName}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        searchName: e.target.value,
                                    }))
                                }
                                className={styles.filterInput}
                            />
                        </div>

                        {activeTab === BeneficiaryTab.MEMBER && (
                            <>
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Age Range</label>
                                    <div className={styles.filterInputRange}>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.minAge}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    minAge: e.target.value,
                                                }))
                                            }
                                            className={styles.filterInput}
                                            aria-label="Minimum age"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.maxAge}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    maxAge: e.target.value,
                                                }))
                                            }
                                            className={styles.filterInput}
                                            aria-label="Maximum age"
                                        />
                                    </div>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Weight Range (kg)</label>
                                    <div className={styles.filterInputRange}>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.minWeight}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    minWeight: e.target.value,
                                                }))
                                            }
                                            className={styles.filterInput}
                                            aria-label="Minimum weight"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.maxWeight}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    maxWeight: e.target.value,
                                                }))
                                            }
                                            className={styles.filterInput}
                                            aria-label="Maximum weight"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className={styles.filterGroup}>
                            <button onClick={resetFilters} className={styles.resetBtn}>
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.resultsCount}>
                    Showing {filteredItems.length} {activeTab.toLowerCase()}
                    {filteredItems.length !== 1 ? "s" : ""}
                    {multiSelectMode && selectedItems.size > 0 && (
                        <span> • {selectedItems.size} selected</span>
                    )}
                </div>

                <div className={styles.modalTableContainer}>
                    <table className={styles.modalTable}>
                        <thead className={styles.modalTableHead}>
                            <tr>
                                {multiSelectMode && (
                                    <th>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={
                                                    filteredItems.length > 0 &&
                                                    selectedItems.size === filteredItems.length
                                                }
                                                onChange={handleSelectAll}
                                                className={styles.checkboxInput}
                                                aria-label="Select all items"
                                            />
                                            Select
                                        </label>
                                    </th>
                                )}
                                <th>Name</th>
                                {activeTab === BeneficiaryTab.MEMBER && (
                                    <>
                                        <th>Age</th>
                                        <th>Sex</th>
                                        <th>Weight (kg)</th>
                                        <th>Contact</th>
                                        <th>Household</th>
                                    </>
                                )}
                                {activeTab === BeneficiaryTab.HOUSEHOLD && (
                                    <>
                                        <th>Address</th>
                                        <th>Members</th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                    </>
                                )}
                                {activeTab === BeneficiaryTab.CLUSTER && (
                                    <>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                    </>
                                )}
                                {!multiSelectMode && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody className={styles.modalTableBody}>
                            {filteredItems.map((item) => renderTableRow(item))}
                        </tbody>
                    </table>
                </div>

                {filteredItems.length === 0 && (
                    <div className={styles.noResults}>
                        No {activeTab.toLowerCase()}s found matching the current filters.
                    </div>
                )}

                <div className={styles.modalActions}>
                    <div className={styles.selectedCount}>
                        {multiSelectMode && selectedItems.size > 0 && (
                            <span>
                                {selectedItems.size} {activeTab.toLowerCase()}
                                {selectedItems.size !== 1 ? "s" : ""} selected
                            </span>
                        )}
                    </div>

                    <div className={styles.modalButtonGroup}>
                        {multiSelectMode && (
                            <button
                                onClick={handleAddSelected}
                                disabled={selectedItems.size === 0 || isProcessing}
                                className={styles.addSelectedBtn}
                                aria-label="Add selected items to the intervention">
                                {isProcessing ? "Adding..." : `Add Selected (${selectedItems.size})`}
                            </button>
                        )}
                        <button
                            onClick={onCloseAction}
                            className={styles.closeModalBtn}
                            disabled={isProcessing}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

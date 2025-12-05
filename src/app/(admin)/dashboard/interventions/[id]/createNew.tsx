"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./createNew.module.css";
import { useParams } from "next/navigation";
import SearchableDropdown from "@/app/(admin)/dashboard/components/SearchableDropdown";
import { useDashboardData } from "@/utils/DashboardContext";
import { saveMember } from "@/lib/api/members";
import useSWR, { mutate } from "swr";
import { Member } from "@/types/members";
import { Intervention } from "@/types/interventions";

type CreateModalProps = {
    isOpen: boolean;
    onCloseAction: () => void;
    isAdd: boolean;
    member: any;
};

export function useinterventionById(id: string) {
    return useSWR(id ? `/api/intervention/${id}` : null, (url) => fetch(url).then((res) => res.json()));
}

export default function CreateModal({ isOpen, onCloseAction, isAdd, member }: CreateModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { members, households, interventions } = useDashboardData();
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : "";
    const { data: program, mutate: mutateIntervention } = useinterventionById(id);

    const [editData, setEditData] = useState(member);
    const [activeTab, setActiveTab] = useState<"profile" | "notes" | "interventions">("profile");
    const [isEditingViewMode, setIsEditingViewMode] = useState(isAdd);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsEditingViewMode(isAdd);
            setEditData(member);
            setActiveTab("profile");
            setError(null);
        }
    }, [isOpen, isAdd, member]);

    function handleEditChange(field: string, value: any) {
        setEditData((prev: any) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!program?._id) return;

        try {
            setError(null); // Clear any previous errors

            const savedMember = await saveMember(editData);

            if (!savedMember || !savedMember._id) {
                setError("Failed to save member. Please check the input.");
                return;
            }

            mutate("/api/member");

            const res = await fetch(`/api/intervention/${program._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    addMemberId: savedMember._id,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update intervention on the server.");
            }

            // Final revalidation (if needed)
            mutateIntervention();
            mutate("/api/intervention");

            onCloseAction();
        } catch (err) {
            console.error("❌ Error in handleSave:", err);
            setError("An error occurred while saving. Please try again.");
        }
    }

    function handleCancel() {
        if (!isAdd) {
            setIsEditingViewMode(false);
            setEditData(member);
        } else {
            onCloseAction();
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onCloseAction();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!isOpen || !member) return null;

    function getMemberOptions(
        members: { _id: string; first_name: string; last_name: string }[],
        excludeId?: string
    ) {
        return members
            .filter((p) => p._id !== excludeId)
            .map((p) => ({
                value: p._id,
                label: `${p.last_name} ${p.first_name}`,
            }));
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalBox} ref={modalRef}>
                <div className={styles.modalHeader}>
                    <button
                        onClick={onCloseAction}
                        className={styles.closeButton}
                        aria-label="Close"
                        type="button">
                        &times;
                    </button>
                    <h3 className={styles.modalTitle}>
                        {isAdd ? "Create Account" : `${member.last_name}, ${member.first_name}`}
                    </h3>
                </div>

                <div className={styles.tabs}>
                    {["profile", "notes", ...(isAdd || isEditingViewMode ? [] : ["interventions"])].map(
                        (tab) => (
                            <button
                                key={tab}
                                className={activeTab === tab ? styles.activeTab : styles.tab}
                                onClick={() => setActiveTab(tab as any)}
                                type="button">
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        )
                    )}
                </div>

                {isEditingViewMode && (
                    <form className={styles.modalBody}>
                        <div className={styles.modalContent}>
                            {activeTab === "profile" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>First Name</label>
                                        <input
                                            className={styles.inputField}
                                            type="text"
                                            value={editData.first_name ?? ""}
                                            onChange={(e) => handleEditChange("first_name", e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>Last Name</label>
                                        <input
                                            className={styles.inputField}
                                            type="text"
                                            value={editData.last_name ?? ""}
                                            onChange={(e) => handleEditChange("last_name", e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>Sex</label>
                                        <select
                                            className={styles.inputField}
                                            value={editData.sex ?? ""}
                                            onChange={(e) => handleEditChange("sex", e.target.value)}
                                            required>
                                            <option value="">Select</option>
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>Birthdate</label>
                                        <input
                                            className={styles.inputField}
                                            type="date"
                                            value={editData.birthdate?.slice(0, 10) ?? ""}
                                            onChange={(e) => handleEditChange("birthdate", e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Weight (kg)</label>
                                        <input
                                            className={styles.inputField}
                                            type="number"
                                            step="0.1"
                                            value={editData.weight ?? ""}
                                            onChange={(e) => handleEditChange("weight", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Contact Number</label>
                                        <input
                                            className={styles.inputField}
                                            type="tel"
                                            placeholder="09xx xxx xxxx"
                                            value={editData.contact_number ?? ""}
                                            onChange={(e) =>
                                                handleEditChange("contact_number", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Household</label>
                                        <select
                                            className={styles.inputField}
                                            value={editData.household ?? ""}
                                            onChange={(e) => handleEditChange("household", e.target.value)}>
                                            <option value="">Select</option>
                                            {households.map((h) => (
                                                <option key={h._id} value={h._id}>
                                                    {h.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>Marital Status</label>
                                        <select
                                            className={styles.inputField}
                                            value={editData.marital_status ?? ""}
                                            onChange={(e) =>
                                                handleEditChange("marital_status", e.target.value)
                                            }
                                            required>
                                            <option value="">Select</option>
                                            {[
                                                "Single",
                                                "Single Parent",
                                                "Married",
                                                "Widowed",
                                                "Separated",
                                                "Partnered",
                                            ].map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Guardians (Max 2)</label>
                                        <SearchableDropdown
                                            options={getMemberOptions(members, member._id)}
                                            value={editData.guardians ?? []}
                                            onChange={(selected) => {
                                                if (selected.length <= 2) {
                                                    handleEditChange("guardians", selected);
                                                }
                                            }}
                                            placeholder="Search guardians..."
                                            isMulti
                                            noResultsText="No matching members"
                                            disableSearch={(editData.guardians ?? []).length >= 2}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Partner</label>
                                        <SearchableDropdown
                                            options={getMemberOptions(members, member._id)}
                                            value={editData.partner ? [editData.partner] : []}
                                            onChange={(selected) =>
                                                handleEditChange("partner", selected[0] || "")
                                            }
                                            placeholder="Search partner..."
                                            isMulti={false}
                                            noResultsText="No matching members"
                                            disableSearch={!!editData.partner}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Occupation</label>
                                        <input
                                            className={styles.inputField}
                                            type="text"
                                            value={editData.occupation ?? ""}
                                            onChange={(e) => handleEditChange("occupation", e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === "notes" && (
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <div className={styles.notesSection}>
                                        <div className={styles.notesGroup}>
                                            <label>General Notes</label>
                                            <textarea
                                                className={`${styles.inputField} ${styles.textArea}`}
                                                value={editData.general_notes ?? ""}
                                                onChange={(e) =>
                                                    handleEditChange("general_notes", e.target.value)
                                                }
                                                placeholder="Enter general notes about this member..."
                                            />
                                        </div>

                                        <div className={styles.notesGroup}>
                                            <label>Sensitive Notes</label>
                                            <textarea
                                                className={`${styles.inputField} ${styles.textArea}`}
                                                value={editData.sensitive_notes ?? ""}
                                                onChange={(e) =>
                                                    handleEditChange("sensitive_notes", e.target.value)
                                                }
                                                placeholder="Enter sensitive information (restricted access)..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.saveButton} onClick={handleSave}>
                                {isAdd ? "Create" : "Save"}
                            </button>

                            {!isAdd && (
                                <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                                    Cancel
                                </button>
                            )}
                        </div>

                        {error && <div className={styles.errorMessage}>{error}</div>}
                    </form>
                )}
            </div>
        </div>
    );
}

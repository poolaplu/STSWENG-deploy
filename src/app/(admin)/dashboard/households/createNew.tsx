"use client";
import React, { useState, useRef, useEffect, use } from "react";
import styles from "./createNew.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { saveHousehold } from "@/lib/api/households";
import { mutate } from "swr";
import { useUser } from "@/utils/UserContext";
import { CLUSTER_OPTIONS, OWNERSHIP_OPTIONS, HOA_STATUS_OPTIONS, Household } from "@/types/households";
import { FeedingChild } from "@/types/feedings";

type HouseholdModalProps = {
    isOpen: boolean;
    onCloseAction: () => void;
    isAdd: boolean;
    household: Household;
};

export default function HouseholdModal({ isOpen, onCloseAction, isAdd, household }: HouseholdModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [editData, setEditData] = useState(household);
    const [activeTab, setActiveTab] = useState<"profile" | "members" | "interventions">("profile");
    const [isEditingViewMode, setIsEditingViewMode] = useState(isAdd);
    const [error, setError] = useState<string | null>(null);
    const user = useUser();

    // get data from the backend
    const { members, households, interventions } = useDashboardData();

    useEffect(() => {
        if (isOpen) {
            setEditData(household);
            setIsEditingViewMode(isAdd);
            setActiveTab("profile");
            setError(null);
        }
    }, [isOpen, isAdd, household]);

    function handleEditChange(field: string, value: any) {
        setEditData((prev: any) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        try {
            const payload = { ...editData };
            if (isAdd) delete payload._id;

            const saved = await saveHousehold(payload);

            if (!saved || !saved._id) {
                setError("Failed to save household. Please check the input.");
                return;
            }

            await mutate(`/api/household`);

            if (isAdd) {
                onCloseAction();
            } else {
                setIsEditingViewMode(false);
                setActiveTab("profile");
            }
        } catch (err) {
            console.error("Error in handleSave:", err);
            setError("An error occurred while saving. Please try again.");
        }
    }

    function handleCancel() {
        if (!isAdd) {
            setIsEditingViewMode(false);
            setEditData(household);
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

    if (!isOpen || !household) return null;

    const householdInterventions = interventions.filter((i) =>
        i.beneficiaries_household?.includes(household._id)
    );

    /*
  const interventions = [
    //
  ];*/

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
                    <h3 className={styles.modalTitle}>{isAdd ? "Create Household" : `${editData.name}`}</h3>
                </div>

                <div className={styles.tabs}>
                    {["profile", ...(isAdd || isEditingViewMode ? [] : ["members", "interventions"])].map(
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

                {isEditingViewMode ? (
                    <form className={styles.modalBody}>
                        <div className={styles.modalContent}>
                            {activeTab === "profile" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>Name</label>
                                        <input
                                            className={styles.inputField}
                                            type="text"
                                            value={editData.name ?? ""}
                                            onChange={(e) => handleEditChange("name", e.target.value)}
                                            required
                                        />
                                    </div>

                                    {!isAdd && (
                                        <div className={styles.formGroup}>
                                            <label htmlFor="head">Head</label>
                                            <select
                                                className={styles.inputField}
                                                value={editData.head?._id ?? ""}
                                                onChange={(e) => {
                                                    const selectedMember = editData.members.find(
                                                        (m) => m._id === e.target.value
                                                    );
                                                    handleEditChange("head", selectedMember ?? null);
                                                }}>
                                                <option value="">Select Head</option>
                                                {editData.members.map((member) => (
                                                    <option key={member._id} value={member._id}>
                                                        {`${member.last_name}, ${member.first_name}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>Cluster</label>
                                        <select
                                            className={styles.inputField}
                                            value={editData.cluster || ""}
                                            onChange={(e) => handleEditChange("cluster", e.target.value)}
                                            required>
                                            <option value="">Select Cluster</option>
                                            {CLUSTER_OPTIONS.map((cluster) => (
                                                <option key={cluster} value={cluster}>
                                                    {cluster}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Ownership</label>
                                        <select
                                            className={styles.inputField}
                                            value={editData.ownership || ""}
                                            onChange={(e) => handleEditChange("ownership", e.target.value)}
                                            required>
                                            <option value="">Select Ownership</option>
                                            {OWNERSHIP_OPTIONS.map((ownership) => (
                                                <option key={ownership} value={ownership}>
                                                    {ownership}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.required}>HOA Last Reached Out</label>
                                        <input
                                            className={styles.inputField}
                                            type="date"
                                            value={
                                                editData.hoa_last_reached_out
                                                    ? editData.hoa_last_reached_out.slice(0, 10)
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                handleEditChange("hoa_last_reached_out", e.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>HOA Status *</label>
                                        <select
                                            className={styles.inputField}
                                            value={editData.hoa_status || ""}
                                            onChange={(e) => handleEditChange("hoa_status", e.target.value)}
                                            required>
                                            <option value="">Select HOA Status</option>
                                            {HOA_STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
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
                ) : (
                    <div className={styles.modalBody}>
                        <div className={styles.modalContent}>
                            {activeTab === "profile" && (
                                <div className={styles.infoSection}>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Name</div>
                                        <div className={styles.infoValue}>{editData.name}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Head</div>
                                        <div className={styles.infoValue}>
                                            {editData.head
                                                ? `${editData.head?.last_name}, ${editData.head?.first_name}`
                                                : ""}
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Cluster</div>
                                        <div className={styles.infoValue}>{editData.cluster}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Ownership</div>
                                        <div className={styles.infoValue}>{editData.ownership}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>HOA Last Reach:</div>
                                        <div className={styles.infoValue}>
                                            {editData?.hoa_last_reached_out
                                                ? new Date(editData?.hoa_last_reached_out).toLocaleDateString(
                                                      "en-US",
                                                      {
                                                          dateStyle: "medium",
                                                      }
                                                  )
                                                : ""}
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>HOA Status</div>
                                        <div className={styles.infoValue}>{editData.hoa_status}</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "members" && !isAdd && (
                                <div className={styles.memberList}>
                                    {(editData.members?.length || 0) > 0 ? (
                                        <ul className={styles.memberLabel}>
                                            {editData.members?.map((memberId) => {
                                                return (
                                                    <option key={memberId._id} value={memberId._id}>
                                                        {`${memberId.last_name}, ${memberId.first_name}`}
                                                    </option>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div>No members linked.</div>
                                    )}
                                </div>
                            )}

                            {activeTab === "interventions" && !isAdd && (
                                <div className={styles.infoSection}>
                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <div className={styles.infoLabel}>Interventions History</div>
                                        <ul className={styles.interventionList}>
                                            {householdInterventions.map((iv, idx) => (
                                                <li key={idx} className={styles.interventionItem}>
                                                    <strong>{iv.date.slice(0, 10)}:</strong> {iv.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            {!isAdd && (
                                <button
                                    type="button"
                                    className={styles.saveButton}
                                    onClick={() => {
                                        if (["interventions", "members"].includes(activeTab)) {
                                            setActiveTab("profile");
                                        }
                                        setIsEditingViewMode(true);
                                    }}>
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

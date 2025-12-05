"use client";
import React, { useState, useRef, useEffect, use } from "react";
import styles from "./createNew.module.css";
import SearchableDropdown from "@/app/(admin)/dashboard/components/SearchableDropdown";
import { useDashboardData } from "@/utils/DashboardContext";
import { saveMember } from "@/lib/api/members";
import { mutate } from "swr";
import { useUser } from "@/utils/UserContext";
import { Member } from "@/types/members";
import { Intervention } from "@/types/interventions";
import { FeedingChild } from "@/types/feedings";

type MemberModalProps = {
    isOpen: boolean;
    onCloseAction: () => void;
    isAdd: boolean;
    member: Member;
};

export default function MemberModal({ isOpen, onCloseAction, isAdd, member }: MemberModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { members, households, interventions, feedings } = useDashboardData();
    const [editData, setEditData] = useState(member);
    const [activeTab, setActiveTab] = useState<"profile" | "notes" | "interventions">("profile");
    const [isEditingViewMode, setIsEditingViewMode] = useState(isAdd);
    const [error, setError] = useState<string | null>(null);
    const user = useUser();

    useEffect(() => {
        if (isOpen) {
            setEditData(member);
            setIsEditingViewMode(isAdd);
            setActiveTab("profile");
            setError(null);
        }
    }, [isOpen, isAdd, member]);

    function handleEditChange(field: string, value: any) {
        setEditData((prev: any) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        try {
            const payload = { ...editData };
            if (isAdd) delete payload._id;

            const saved = await saveMember(payload);

            if (!saved || !saved._id) {
                setError("Failed to save member. Please check the input.");
                return;
            }

            await mutate(`/api/member`);
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

    const memberInterventions = interventions.filter((i) => i.beneficiaries_member?.includes(member._id));
    const memberFeedings = feedings.filter((feeding) =>
        feeding.beneficiaries?.some((child: FeedingChild) => {
            const memberObj = child.idMember;
            return typeof memberObj === "object" && memberObj._id === member._id;
        })
    );

    console.log(memberFeedings);

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
                        {isAdd ? "Create Member" : `${editData.last_name}, ${editData.first_name}`}
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

                {isEditingViewMode ? (
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
                                            value={editData.household?._id || ""}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const selected = households.find((h) => h._id === selectedId);
                                                handleEditChange("household", selected || undefined);
                                            }}>
                                            <option value="">Select</option>
                                            {households.map((household) => (
                                                <option key={household._id} value={household._id}>
                                                    {household.name}
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
                                            options={getMemberOptions(members, editData._id)}
                                            value={(editData.guardians ?? []).map((g: any) =>
                                                typeof g === "string" ? g : g._id
                                            )}
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
                                            options={members
                                                .filter((p) => p._id !== editData._id)
                                                .map((p) => ({
                                                    value: p._id,
                                                    label: `${p.last_name} ${p.first_name}`,
                                                }))}
                                            value={editData.partner?._id ? [editData.partner._id] : []}
                                            onChange={(selected) => {
                                                const selectedId = selected[0] || "";
                                                const selectedProfile = members.find(
                                                    (p) => p._id === selectedId
                                                );
                                                handleEditChange("partner", selectedProfile || "");
                                            }}
                                            placeholder="Search partner..."
                                            isMulti={false}
                                            noResultsText="No matching profiles"
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

                                        {user.role === "admin" && (
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
                                        )}
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
                ) : (
                    <div className={styles.modalBody}>
                        <div className={styles.modalContent}>
                            {activeTab === "profile" && (
                                <div className={styles.infoSection}>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>First Name</div>
                                        <div className={styles.infoValue}>{editData.first_name}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Last Name</div>
                                        <div className={styles.infoValue}>{editData.last_name}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Sex</div>
                                        <div className={styles.infoValue}>{editData.sex}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Birthdate</div>
                                        <div className={styles.infoValue}>
                                            {editData?.birthdate
                                                ? new Date(editData?.birthdate).toLocaleDateString("en-US", {
                                                      dateStyle: "medium",
                                                  })
                                                : ""}
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Weight</div>
                                        <div className={styles.infoValue}>
                                            {editData.weight ? `${editData.weight} kg` : ""}{" "}
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Contact</div>
                                        <div className={styles.infoValue}>{editData.contact_number}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Household</div>
                                        <div className={styles.infoValue}>
                                            {editData.household?.name || ""}
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Marital Status</div>
                                        <div className={styles.infoValue}>{editData.marital_status}</div>
                                    </div>

                                    <div className={`${styles.infoItem}`}>
                                        <div className={styles.infoLabel}>Guardians</div>
                                        <div className={styles.infoValue}>
                                            {(editData.guardians ?? [])
                                                .map((g) => `${g.last_name}, ${g.first_name}`)
                                                .join("; ")}
                                        </div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Partner</div>
                                        <div className={styles.infoValue}>
                                            {editData.partner
                                                ? `${editData.partner.last_name}, ${editData.partner.first_name}`
                                                : ""}
                                        </div>
                                    </div>

                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <div className={styles.infoLabel}>Occupation</div>
                                        <div className={styles.infoValue}>{editData.occupation}</div>
                                    </div>
                                </div>
                            )}
                            {activeTab === "notes" && (
                                <div className={styles.notesSection}>
                                    <div className={styles.notesGroup}>
                                        <label>General Notes</label>
                                        <div className={styles.infoValue}>
                                            {editData.general_notes || "No general notes available."}
                                        </div>
                                    </div>

                                    {user.role === "admin" && (
                                        <div className={styles.notesGroup}>
                                            <label>Sensitive Notes</label>
                                            <div className={styles.infoValue}>
                                                {editData.sensitive_notes || "No sensitive notes available."}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === "interventions" && (
                                <div className={styles.infoSection}>
                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <div className={styles.infoLabel}>Interventions History</div>
                                        <ul className={styles.interventionList}>
                                            {memberInterventions.map((iv, idx) => (
                                                <li key={idx} className={styles.interventionItem}>
                                                    <strong>{iv.date.slice(0, 10)}:</strong> {iv.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <div className={styles.infoLabel}>Feeding Programs History</div>
                                        <ul className={styles.interventionList}>
                                            {memberFeedings.map((iv, idx) => (
                                                <li key={idx} className={styles.interventionItem}>
                                                    <strong>{iv.date_started.slice(0, 10)}:</strong> {iv.name}
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
                                        if (activeTab === "interventions") {
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

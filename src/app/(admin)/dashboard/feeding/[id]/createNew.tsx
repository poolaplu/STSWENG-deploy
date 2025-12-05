"use client";
import React, { useState, useRef, useEffect, use } from "react";
import styles from "./createNew.module.css";
import { useParams } from "next/navigation";
import SearchableDropdown from "@/app/(admin)/dashboard/components/SearchableDropdown";
import { Feeding, FeedingChild } from "@/types/feedings";
import { Member } from "@/types/members";
import useSWR, { mutate } from "swr";
import { useDashboardData } from "@/utils/DashboardContext";
import { saveMember } from "@/lib/api/members";
import { useUser } from "@/utils/UserContext";

type CreateModalProps = {
    isOpen: boolean;
    onCloseAction: () => void;
    isAdd: boolean;
    member: any;
};

export function useFeedingById(id: string) {
    return useSWR(id ? `/api/feeding/${id}` : null, (url) => fetch(url).then((res) => res.json()));
}

export default function CreateModal({ isOpen, onCloseAction, isAdd, member }: CreateModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { members, households, feedings, interventions } = useDashboardData();
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : "";
    const { data: program, mutate: mutateFeeding } = useFeedingById(id);
    const user = useUser();

    const [editData, setEditData] = useState(member);
    const [activeTab, setActiveTab] = useState<"profile" | "notes" | "interventions">("profile");
    const [isEditingViewMode, setIsEditingViewMode] = useState(isAdd);
    const [showSensitiveNotes, setShowSensitiveNotes] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsEditingViewMode(isAdd);
            setEditData(member);
            setActiveTab("profile");
            setError(null);
            setShowSensitiveNotes(false);
        }
    }, [isOpen, isAdd, member]);

    function handleEditChange(field: string, value: any) {
        setEditData((prev: any) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!program?._id) return;

        try {
            const savedMember = await saveMember(editData);

            if (!savedMember || !savedMember._id) {
                setError("Failed to save member. Please check the input.");
                return;
            }

            if (isAdd) {
                const res = await fetch("/api/feeding/child", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        idMember: savedMember._id,
                        idFeedingProgram: program._id,
                        weight_initial: 0,
                        height_initial: 0,
                    }),
                });

                if (!res.ok) {
                    throw new Error("Failed to create FeedingChild");
                }

                const createdChild = await res.json();
            }

            mutate("/api/member");
            mutateFeeding();
            mutate("/api/feeding");
            onCloseAction();
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

    const householdName =
        (member.household && households.find((h) => h._id === member.household)?.name) || "";

    function getPartnerName(partnerId: string) {
        const found = members.find((p) => p._id === partnerId);
        return found ? `${found.last_name}, ${found.first_name}` : "";
    }

    function getGuardianNames(
        guardians: (string | { _id: string; first_name: string; last_name: string })[]
    ) {
        return guardians
            .map((g) => {
                if (typeof g === "string") {
                    const found = members.find((p) => p._id === g);
                    return found ? `${found.last_name}, ${found.first_name}` : "";
                } else {
                    return `${g.last_name}, ${g.first_name}`;
                }
            })
            .filter(Boolean)
            .join("; ");
    }

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

    const partnerName = getPartnerName(member.partner);
    const guardianNames = Array.isArray(member.guardians) ? getGuardianNames(member.guardians) : "";

    const memberInterventions = interventions.filter((i) => i.beneficiaries_member?.includes(member._id));
    const memberFeedings = feedings.filter((feeding) =>
        feeding.beneficiaries?.some((child: FeedingChild) => {
            const memberObj = child.idMember;
            return typeof memberObj === "object" && memberObj._id === member._id;
        })
    );

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
                                                .filter((p) => p._id !== member._id)
                                                .map((p) => ({
                                                    value: p._id,
                                                    label: `${p.last_name} ${p.first_name}`,
                                                }))}
                                            value={editData.partner ? [editData.partner._id] : []}
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
                                        <div className={styles.infoValue}>{member.first_name}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Last Name</div>
                                        <div className={styles.infoValue}>{member.last_name}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Sex</div>
                                        <div className={styles.infoValue}>{member.sex}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Birthdate</div>
                                        <div className={styles.infoValue}>
                                            {member?.birthdate
                                                ? new Date(member?.birthdate).toLocaleDateString("en-US", {
                                                      dateStyle: "medium",
                                                  })
                                                : "N/A"}
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Weight</div>
                                        <div className={styles.infoValue}>{member.weight} kg</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Contact</div>
                                        <div className={styles.infoValue}>{member.contact_number}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Household</div>
                                        <div className={styles.infoValue}>{householdName}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Marital Status</div>
                                        <div className={styles.infoValue}>{member.marital_status}</div>
                                    </div>

                                    <div className={`${styles.infoItem}`}>
                                        <div className={styles.infoLabel}>Guardians</div>
                                        <div className={styles.infoValue}>{guardianNames}</div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <div className={styles.infoLabel}>Partner</div>
                                        <div className={styles.infoValue}>{partnerName}</div>
                                    </div>

                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <div className={styles.infoLabel}>Occupation</div>
                                        <div className={styles.infoValue}>{member.occupation}</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "notes" && (
                                <div className={styles.notesSection}>
                                    <div className={styles.notesGroup}>
                                        <label>General Notes</label>
                                        <div className={styles.infoValue}>
                                            {member.general_notes || "No general notes available."}
                                        </div>
                                    </div>

                                    {user.role === "admin" && (
                                        <div className={styles.notesGroup}>
                                            <label>Sensitive Notes</label>
                                            <div className={styles.infoValue}>
                                                {member.sensitive_notes || "No sensitive notes available."}
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
                                    onClick={() => setIsEditingViewMode(true)}>
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

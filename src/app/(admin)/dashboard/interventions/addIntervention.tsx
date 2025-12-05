"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./addIntervention.module.css";
import { Intervention } from "@/types/interventions";
import { saveIntervention } from "@/lib/api/interventions";
import { mutate } from "swr";
import { useUser } from "@/utils/UserContext";

const initialIntervention: Intervention = {
    name: "",
    description: "",
    date: new Date().toISOString(),
    sensitive: false,
    type: "",
    expenditures: [],
    beneficiaries_member: [],
    beneficiaries_household: [],
    beneficiaries_cluster: [],
    pinned: false,
    last_modified: new Date().toISOString(),
};

export type InterventionsModalProps = {
    isOpen: boolean;
    onCloseAction: () => void;
    intervention: Intervention;
    isAdd?: boolean;
};

export default function InterventionModal({
    isOpen,
    onCloseAction,
    intervention,
    isAdd,
}: InterventionsModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [editData, setEditData] = useState(intervention);
    const [typeOptions, setTypeOptions] = useState<string[]>([
        "Food",
        "Scholarship",
        "Relief",
        "Counseling",
        "Service",
    ]);

    const [typeInput, setTypeInput] = useState(intervention.type || "");
    const [showDropdown, setShowDropdown] = useState(false);
    const user = useUser();

    useEffect(() => {
        if (isOpen) {
            if (isAdd) {
                setEditData(initialIntervention);
                setTypeInput("");
            } else if (intervention) {
                setEditData(intervention);
                setTypeInput(intervention.type || "");
            }
        }
    }, [isOpen, isAdd, intervention]);

    function handleChange(field: keyof Intervention, value: any) {
        setEditData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!editData) return;

        try {
            const payload = { ...editData };
            if (isAdd) {
                delete payload._id;
            }

            const saved = await saveIntervention(payload);

            mutate("/api/intervention");

            setEditData(saved);
            onCloseAction();
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setEditData((prev) => ({
            ...prev,
            last_modified: new Date().toISOString(),
        }));
        handleSave();
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onCloseAction();
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "unset";
        };
    }, [onCloseAction, isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer} ref={modalRef}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalHeader}>
                        <div className={styles.headerContent}>
                            <div>
                                <h2 className={styles.modalTitle}>
                                    {isAdd ? "Create New Intervention" : "Edit Intervention"}
                                </h2>
                                <p className={styles.modalSubtitle}>
                                    {isAdd
                                        ? "Set up a new intervention for your community"
                                        : "Update the details of your intervention"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCloseAction}
                            className={styles.closeButton}
                            aria-label="Close modal"
                            type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="program-name" className={styles.label}>
                                    Intervention Name <span className={styles.required}>*</span>
                                </label>
                                <input
                                    id="program-name"
                                    className={styles.inputField}
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Enter intervention name"
                                    autoComplete="off"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="program-description" className={styles.label}>
                                    Description
                                </label>
                                <textarea
                                    id="program-description"
                                    className={`${styles.inputField} ${styles.textareaField}`}
                                    value={editData.description ?? ""}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="Describe the intervention goals and activities"
                                    rows={3}
                                    autoComplete="off"
                                />
                            </div>

                            <div className={styles.dateGroup}>
                                <div
                                    className={styles.formGroup}
                                    style={{ position: "relative", zIndex: 10 }}>
                                    <label htmlFor="intervention-type" className={styles.label}>
                                        Intervention Type <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        id="intervention-type"
                                        type="text"
                                        className={styles.inputField}
                                        placeholder="Type or select type"
                                        value={typeInput}
                                        onChange={(e) => {
                                            setTypeInput(e.target.value);
                                            handleChange("type", e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                        autoComplete="off"
                                        required
                                    />
                                    {showDropdown && (
                                        <ul className={styles.dropdown}>
                                            {typeOptions
                                                .filter((type) =>
                                                    type.toLowerCase().includes(typeInput.toLowerCase())
                                                )
                                                .map((type) => (
                                                    <li
                                                        key={type}
                                                        className={styles.dropdownItem}
                                                        onClick={() => {
                                                            setTypeInput(type);
                                                            handleChange("type", type);
                                                            setShowDropdown(false);
                                                        }}>
                                                        {type}
                                                    </li>
                                                ))}
                                            {!typeOptions.includes(typeInput) && typeInput.trim() !== "" && (
                                                <li
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setTypeOptions((prev) => [...prev, typeInput]);
                                                        handleChange("type", typeInput);
                                                        setShowDropdown(false);
                                                    }}>
                                                    ➕ Add "{typeInput}"
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="date" className={styles.label}>
                                        Date
                                        <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        id="date"
                                        className={styles.inputField}
                                        type="date"
                                        value={editData.date.slice(0, 10) ?? ""}
                                        onChange={(e) => handleChange("date", e.target.value)}
                                        required
                                    />
                                </div>
                                {user.role === "admin" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={editData.sensitive}
                                                onChange={(e) => handleChange("sensitive", e.target.checked)}
                                            />
                                            Mark as sensitive
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelButton} onClick={onCloseAction}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveButton}>
                            {isAdd ? "Create Intervention" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

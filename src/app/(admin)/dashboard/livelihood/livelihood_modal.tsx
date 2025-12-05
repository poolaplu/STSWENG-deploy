"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./modal.module.css";
import { Livelihood } from "@/types/livelihoods";
import { saveLivelihood } from "@/lib/api/livelihoods";
import { mutate } from "swr";

export type LivelihoodModalProps = {
    isOpen: boolean;
    onCloseAction: () => void;
    livelihood: Livelihood;
    isAdd?: boolean;
};

export default function LivelihoodModal({ isOpen, onCloseAction, livelihood, isAdd }: LivelihoodModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [editData, setEditData] = useState(livelihood);

    useEffect(() => {
        if (livelihood) {
            setEditData(livelihood);
        }
    }, [livelihood]);

    function handleChange(field: keyof Livelihood, value: any) {
        setEditData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!editData) return;

        try {
            const payload = { ...editData };
            if (isAdd) {
                delete payload._id;
            }

            const saved = await saveLivelihood(payload);

            mutate("/api/livelihood");

            setEditData(saved);
            onCloseAction();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to save livelihood.");
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
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
                                    {isAdd ? "Create New Livelihood" : "Edit Livelihood"}
                                </h2>
                                <p className={styles.modalSubtitle}>
                                    {isAdd
                                        ? "Set up a new livelihood business"
                                        : "Update the details of your livelihood"}
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
                                <label htmlFor="livelihood-name" className={styles.label}>
                                    Livelihood Name <span className={styles.required}>*</span>
                                </label>
                                <input
                                    id="livelihood-name"
                                    className={styles.inputField}
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Enter livelihood name"
                                    autoComplete="off"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="date-created" className={styles.label}>
                                    Date Created
                                    <span className={styles.required}>*</span>
                                </label>
                                <input
                                    id="date-created"
                                    className={styles.inputField}
                                    type="date"
                                    value={editData.date_created.slice(0, 10) ?? ""}
                                    onChange={(e) => handleChange("date_created", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelButton} onClick={onCloseAction}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveButton}>
                            {isAdd ? "Create Livelihood" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

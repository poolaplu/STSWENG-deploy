"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./modal.module.css";
import { Feeding } from "@/types/feedings";
import { saveFeedingProgram } from "@/lib/api/feedings";
import { mutate } from "swr";

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

export type FeedingModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  feeding: Feeding;
  isAdd?: boolean;
};

export default function FeedingModal({
  isOpen,
  onCloseAction,
  feeding,
  isAdd,
}: FeedingModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [editData, setEditData] = useState(feeding);

  useEffect(() => {
    if (isOpen) {
      if (isAdd) {
        setEditData(initialFeedingProgram);
      } else if (feeding) {
        setEditData(feeding);
      }
    }
  }, [isOpen, isAdd, feeding]);

  function handleChange(field: keyof Feeding, value: any) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!editData) return;

    try {
      const payload = { ...editData };
      if (isAdd) {
        delete payload._id;
      }

      const saved = await saveFeedingProgram(payload);

      mutate("/api/feeding");

      setEditData(saved);
      onCloseAction();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save household.");
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
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
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
                  {isAdd
                    ? "Create New Feeding Program"
                    : "Edit Feeding Program"}
                </h2>
                <p className={styles.modalSubtitle}>
                  {isAdd
                    ? "Set up a new feeding program for your community"
                    : "Update the details of your feeding program"}
                </p>
              </div>
            </div>
            <button
              onClick={onCloseAction}
              className={styles.closeButton}
              aria-label="Close modal"
              type="button"
            >
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
                  Program Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="program-name"
                  className={styles.inputField}
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter program name"
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
                  placeholder="Describe the feeding program goals and activities"
                  autoComplete="off"
                  rows={3}
                />
              </div>

              <div className={styles.dateGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor="start-date" className={styles.label}>
                    Start Date
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="start-date"
                    className={styles.inputField}
                    type="date"
                    value={
                      editData.date_started
                        ? new Date(editData.date_started)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      handleChange("date_started", e.target.value)
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="end-date" className={styles.label}>
                    End Date
                  </label>
                  <input
                    id="end-date"
                    className={styles.inputField}
                    type="date"
                    value={
                      editData.date_ended
                        ? new Date(editData.date_ended)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    onChange={(e) => handleChange("date_ended", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCloseAction}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {isAdd ? "Create Program" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

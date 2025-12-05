"use client";
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./feedingid.module.css";
import { Feeding, FeedingChild } from "@/types/feedings";
import { useDashboardData } from "@/utils/DashboardContext";
import { mutate } from "swr";
import useSWR from "swr";

type AddExistingProps = {
  isOpen: boolean;
  onCloseAction: () => void;
};

export function useFeedingById(id: string) {
  return useSWR(id ? `/api/feeding/${id}` : null, (url) =>
    fetch(url).then((res) => res.json())
  );
}

export default function AddExistingModal({
  isOpen,
  onCloseAction,
}: AddExistingProps) {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [program, setProgram] = useState<Feeding | null>(null);
  const { members: membersRows, feedings } = useDashboardData();
  const { data: feeding, mutate: mutateFeeding } = useFeedingById(id);
  const [feedingChildren, setFeedingChildren] = useState<FeedingChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (feeding) {
      setProgram(feeding);
      if (feeding.beneficiaries && Array.isArray(feeding.beneficiaries)) {
        setFeedingChildren(feeding.beneficiaries);
      }
      setLoading(false);

      console.log("FeedingChildren:", feedingChildren);
    }
  }, [feeding]);

  const [filters, setFilters] = useState({
    excludeOngoing: true,
    minAge: "",
    maxAge: "",
    minWeight: "",
    maxWeight: "",
    searchName: "",
  });

  const addBeneficiary = async (memberId: string) => {
    if (!program?._id) return;

    try {
      setIsProcessing(true);

      const createChildRes = await fetch("/api/feeding/child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idMember: memberId,
          idFeedingProgram: program._id,
          weight_initial: 0,
          height_initial: 0,
        }),
      });

      if (!createChildRes.ok) {
        throw new Error("Failed to create FeedingChild");
      }

      const createdChild = await createChildRes.json();

      setFeedingChildren((prev) => [...prev, createdChild]);

      setProgram((prev) => ({
        ...prev!,
        beneficiaries: [...(prev?.beneficiaries || []), createdChild._id],
      }));

      await mutateFeeding();
      mutate("/api/feeding");
    } catch (error) {
      console.error("Error adding beneficiary:", error);
      alert("Failed to add beneficiary. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addMultipleBeneficiaries = async (memberIds: string[]) => {
    if (!program?._id || memberIds.length === 0) return;

    try {
      setIsProcessing(true);
      const createdChildren: FeedingChild[] = [];

      for (const memberId of memberIds) {
        const createChildRes = await fetch("/api/feeding/child", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idMember: memberId,
            idFeedingProgram: program._id,
            weight_initial: 0,
            height_initial: 0,
          }),
        });

        if (!createChildRes.ok) {
          console.error(`Failed to create FeedingChild for member ${memberId}`);
          continue;
        }

        const createdChild = await createChildRes.json();
        createdChildren.push(createdChild);
      }

      if (createdChildren.length === 0) {
        throw new Error("No beneficiaries created");
      }

      await mutateFeeding();
      mutate("/api/feeding");
    } catch (error) {
      console.error("Error adding multiple beneficiaries:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getExcludedMemberIds = () => {
    const excludedIds: string[] = [];

    if (Array.isArray(feedingChildren)) {
      for (const child of feedingChildren) {
        let memberId = "";

        if (typeof child.idMember === "string") {
          memberId = child.idMember;
        } else if (
          typeof child.idMember === "object" &&
          "_id" in child.idMember
        ) {
          memberId = child.idMember._id;
        }

        if (memberId && !excludedIds.includes(memberId)) {
          excludedIds.push(memberId);
        }
      }
    }

    if (filters.excludeOngoing && Array.isArray(feedings)) {
      for (const feedingProgram of feedings) {
        if (feedingProgram._id === feeding?._id) continue;

        if (feedingProgram.status !== "Ongoing") continue;

        if (Array.isArray(feedingProgram.beneficiaries)) {
          for (const beneficiary of feedingProgram.beneficiaries) {
            let id = "";

            if (typeof beneficiary === "string") {
              id = beneficiary;
            } else if (beneficiary?.idMember?._id) {
              id = beneficiary.idMember._id;
            } else if (beneficiary?.idMember) {
              id = beneficiary.idMember;
            }

            if (id && !excludedIds.includes(id)) {
              excludedIds.push(id);
            }
          }
        }
      }
    }

    return excludedIds;
  };
  const getFilteredMembers = () => {
    if (!membersRows) return [];

    const excludedMemberIds = getExcludedMemberIds();

    return membersRows.filter((member) => {
      // Exclude members that are already in programs
      if (excludedMemberIds.includes(member._id)) {
        return false;
      }

      const age = calculateAge(member.birthdate);

      if (filters.minAge && age !== null && age < parseInt(filters.minAge)) {
        return false;
      }
      if (filters.maxAge && age !== null && age > parseInt(filters.maxAge)) {
        return false;
      }

      const weight = parseFloat(member.weight);
      if (
        filters.minWeight &&
        (!weight || weight < parseFloat(filters.minWeight))
      ) {
        return false;
      }
      if (
        filters.maxWeight &&
        (!weight || weight > parseFloat(filters.maxWeight))
      ) {
        return false;
      }
      if (filters.searchName) {
        const fullName =
          `${member.first_name} ${member.last_name}`.toLowerCase();
        if (!fullName.includes(filters.searchName.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredMembers = getFilteredMembers();

  const resetFilters = () => {
    setFilters({
      excludeOngoing: true,
      minAge: "",
      maxAge: "",
      minWeight: "",
      maxWeight: "",
      searchName: "",
    });
  };

  const handleMemberSelect = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m._id)));
    }
  };

  const handleAddSelected = () => {
    if (selectedMembers.size > 0) {
      addMultipleBeneficiaries(Array.from(selectedMembers));
      setSelectedMembers(new Set());
      onCloseAction();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onCloseAction()}
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        <h3 id="modal-title" className={styles.modalTitle}>
          Add Beneficiaries
        </h3>

        <div className={styles.selectionModeToggle}>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={multiSelectMode}
              onChange={(e) => {
                setMultiSelectMode(e.target.checked);
                setSelectedMembers(new Set());
              }}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>
          <span className={styles.toggleLabel}>
            {multiSelectMode
              ? "Multiple Selection Mode"
              : "Single Selection Mode"}
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

            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.excludeOngoing}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      excludeOngoing: e.target.checked,
                    }))
                  }
                  className={styles.checkboxInput}
                />
                Exclude members in ongoing programs
              </label>
            </div>
            <div className={styles.filterGroup}>
              <button onClick={resetFilters} className={styles.resetBtn}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className={styles.resultsCount}>
          Showing {filteredMembers.length} member
          {filteredMembers.length !== 1 ? "s" : ""}
          {multiSelectMode && selectedMembers.size > 0 && (
            <span> • {selectedMembers.size} selected</span>
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
                          filteredMembers.length > 0 &&
                          selectedMembers.size === filteredMembers.length
                        }
                        onChange={handleSelectAll}
                        className={styles.checkboxInput}
                        aria-label="Select all members"
                      />
                      Select
                    </label>
                  </th>
                )}
                <th>Name</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Weight (kg)</th>
                <th>Contact</th>
                {!multiSelectMode && <th>Action</th>}
              </tr>
            </thead>
            <tbody className={styles.modalTableBody}>
              {filteredMembers.map((member) => {
                const age = calculateAge(member.birthdate);
                const isSelected = selectedMembers.has(member._id);
                return (
                  <tr key={member._id}>
                    {multiSelectMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberSelect(member._id)}
                          className={styles.checkboxInput}
                          aria-label={`Select ${member.first_name} ${member.last_name}`}
                        />
                      </td>
                    )}
                    <td>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberMainName}>
                          {member.first_name} {member.last_name}
                        </div>
                        {member.marital_status && (
                          <div className={styles.memberSubInfo}>
                            {member.marital_status}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{age !== null ? `${age} years` : "N/A"}</td>
                    <td>{member.sex || "N/A"}</td>
                    <td>{member.weight ? `${member.weight} kg` : "N/A"}</td>
                    <td>{member.contact_number || "N/A"}</td>
                    {!multiSelectMode && (
                      <td>
                        <button
                          onClick={() => {
                            addBeneficiary(member._id);
                            onCloseAction();
                          }}
                          className={styles.addSingleBtn}
                          disabled={isProcessing}
                          aria-label={`Add ${member.first_name} ${member.last_name} to the program`}
                        >
                          {isProcessing ? "..." : "Add"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className={styles.noResults}>
            No members found matching the current filters.
          </div>
        )}

        <div className={styles.modalActions}>
          <div className={styles.selectedCount}>
            {multiSelectMode && selectedMembers.size > 0 && (
              <span>
                {selectedMembers.size} member
                {selectedMembers.size !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div className={styles.modalButtonGroup}>
            {multiSelectMode && (
              <button
                onClick={handleAddSelected}
                disabled={selectedMembers.size === 0 || isProcessing}
                className={styles.addSelectedBtn}
                aria-label="Add selected members to the program"
              >
                {isProcessing
                  ? "Adding..."
                  : `Add Selected (${selectedMembers.size})`}
              </button>
            )}
            <button
              onClick={() => onCloseAction()}
              className={styles.closeModalBtn}
              disabled={isProcessing}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

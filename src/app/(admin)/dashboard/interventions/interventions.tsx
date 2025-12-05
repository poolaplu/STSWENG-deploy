"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import styles from "./interventions.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import InterventionModal from "./addIntervention";
import { saveIntervention, deleteIntervention } from "@/lib/api/interventions";
import { Intervention } from "@/types/interventions";
import { useUser } from "@/utils/UserContext";
import SectionExportButton from "@/app/components/SectionExportButton";

const initialIntervention: Intervention = {
  name: "",
  description: "",
  date: "",
  sensitive: false,
  type: "",
  expenditures: [],
  beneficiaries_member: [],
  beneficiaries_household: [],
  beneficiaries_cluster: [],
  pinned: false,
  last_modified: new Date().toISOString(),
};

const SORT_OPTIONS = [
  { value: "date_desc", label: "Start Date (Newest)" },
  { value: "date", label: "Start Date (Oldest)" },
  { value: "last_modified_desc", label: "Last Modified (Newest)" },
  { value: "last_modified", label: "Last Modified (Oldest)" },
  { value: "name", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

export default function InterventionTab() {
  const { interventions } = useDashboardData();
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState<Intervention | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [localPinnedState, setLocalPinnedState] = useState<
    Record<string, boolean>
  >({});
  const [filterType, setFilterType] = useState("");
  const [filterSensitive, setFilterSensitive] = useState("");
  const typeOptions = useMemo(() => {
    const allTypes = new Set<string>([
      "Food",
      "Scholarship",
      "Relief",
      "Counseling",
      "Service",
    ]);

    interventions.forEach((item) => {
      if (item.type) allTypes.add(item.type);
    });

    return Array.from(allTypes).sort();
  }, [interventions]);

  const router = useRouter();

  const filteredAndSortedInterventions = useMemo(() => {
    const locallyUpdatedInterventions = interventions.map((item) => ({
      ...item,
      pinned: localPinnedState[item._id!] ?? item.pinned,
    }));

    let filtered = locallyUpdatedInterventions.filter((item) => {
      if (
        searchTerm &&
        !item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (dateRangeStart || dateRangeEnd) {
        const startDate = new Date(item.date);
        if (dateRangeStart && startDate < new Date(dateRangeStart))
          return false;
        if (dateRangeEnd && startDate > new Date(dateRangeEnd)) return false;
      }

      if (item.sensitive && user.role !== "admin") {
        return false;
      }

      if (filterType && item.type !== filterType) return false;

      if (filterSensitive === "yes" && !item.sensitive) return false;
      if (filterSensitive === "no" && item.sensitive) return false;

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date_desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "last_modified":
          return (
            new Date(a.last_modified).getTime() -
            new Date(b.last_modified).getTime()
          );
        case "last_modified_desc":
          return (
            new Date(b.last_modified).getTime() -
            new Date(a.last_modified).getTime()
          );
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    interventions,
    localPinnedState,
    searchTerm,
    dateRangeStart,
    dateRangeEnd,
    sortBy,
    filterType,
    filterSensitive,
    user?.role,
  ]);

  const pinnedPrograms = filteredAndSortedInterventions.filter((p) => p.pinned);

  // Get current date and calculate time boundaries
  const now = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(now.getDate() + 14);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const monthAfterNext = nextMonth === 11 ? 0 : nextMonth + 1;
  const monthAfterNextYear =
    nextMonth === 11 ? nextMonthYear + 1 : nextMonthYear;

  // Month names for display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function sortInterventions(
    interventions: Intervention[],
    sortBy: string
  ): Intervention[] {
    return interventions.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date_desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "last_modified":
          return (
            new Date(a.last_modified || 0).getTime() -
            new Date(b.last_modified || 0).getTime()
          );
        case "last_modified_desc":
          return (
            new Date(b.last_modified || 0).getTime() -
            new Date(a.last_modified || 0).getTime()
          );
        case "type":
          return a.type.localeCompare(b.type);
        case "type_desc":
          return b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });
  }

  function categorizeInterventions(
    interventions: Intervention[],
    sortBy: string
  ): { name: string; data: Intervention[] }[] {
    if (
  sortBy.includes("last_modified") ||
  sortBy === "name" ||
  sortBy === "name_desc"
) {
  return [{ name: "All Interventions", data: interventions }];
}

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const sectionMap: Record<string, Intervention[]> = {
      "Upcoming Interventions": [],
      "Recent Interventions": [],
      "This Month": [],
    };

    // Group into the correct sections
    interventions.forEach((item) => {
      const date = new Date(item.date);
      const isThisMonth =
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (date > now && date <= twoWeeksFromNow) {
        sectionMap["Upcoming Interventions"].push(item);
      } else if (date < now && date >= twoWeeksAgo) {
        sectionMap["Recent Interventions"].push(item);
      } else if (isThisMonth) {
        sectionMap["This Month"].push(item);
      } else {
        const monthYear = `${
          monthNames[date.getMonth()]
        } ${date.getFullYear()}`;
        if (!sectionMap[monthYear]) {
          sectionMap[monthYear] = [];
        }
        sectionMap[monthYear].push(item);
      }
    });

    const sortedSections = Object.entries(sectionMap).map(([name, data]) => ({
      name,
      data: sortInterventions(data, sortBy),
    }));

    const prioritiesDesc = new Map([
      ["Upcoming Interventions", 0],
      ["Recent Interventions", 1],
      ["This Month", 2],
    ]);

    const prioritiesAsc = new Map([
      ["This Month", 1],
      ["Recent Interventions", 2],
      ["Upcoming Interventions", 3],
    ]);

    const sectionPriority = (label: string): number =>
      sortBy === "date_desc"
        ? prioritiesDesc.get(label) ?? 3
        : prioritiesAsc.get(label) ?? 0;

    const getDateFromLabel = (label: string): number => {
      const parts = label.split(" ");
      const monthIndex = monthNames.indexOf(parts[0]);
      const year = parseInt(parts[1], 10);
      if (monthIndex === -1 || isNaN(year)) return 0;
      return new Date(year, monthIndex).getTime();
    };

    const timeOrdered = sortedSections.sort((a, b) => {
      const aPriority = sectionPriority(a.name);
      const bPriority = sectionPriority(b.name);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Only apply date sorting to Month-Year sections
      if (!prioritiesDesc.has(a.name) && !prioritiesAsc.has(a.name)) {
        const aDate = getDateFromLabel(a.name);
        const bDate = getDateFromLabel(b.name);
        return sortBy === "date_desc" ? bDate - aDate : aDate - bDate;
      }

      return 0; // Keep current order for same-priority non-date labels
    });

    return timeOrdered;
  }

  function resetModalState() {
    setIsModalOpen(false);
    setIsEdit(false);
    setIsAdd(false);
    setEditData(null);
  }

  const unpinnedInterventions = filteredAndSortedInterventions.filter(
    (i) => !i.pinned
  );
  const categorizedInterventions = categorizeInterventions(
    unpinnedInterventions,
    sortBy
  );

  async function togglePin(intervention: Intervention, pinned: boolean) {
    const id = intervention._id!;
    setLocalPinnedState((prev) => ({ ...prev, [id]: pinned })); // optimistic update

    try {
      await saveIntervention({ ...intervention, pinned });
      mutate("/api/intervention"); // revalidate
    } catch (err) {
      console.error("Failed to toggle pin", err);
      setLocalPinnedState((prev) => ({ ...prev, [id]: !pinned })); // revert
    }
  }

  async function handleDelete(intervention: Intervention) {
    if (!intervention._id) {
      console.error("No _id found on intervention", intervention);
      return;
    }

    if (
      window.confirm(`Are you sure you want to delete "${intervention.name}"?`)
    ) {
      try {
        await deleteIntervention(intervention._id);
        mutate("/api/intervention");
      } catch (err) {
        console.error("Failed to delete intervention", err);
      }
    }
  }
  function handleEdit(intervention: Intervention) {
    setEditData(intervention);
    setIsEdit(true);
    setIsModalOpen(true);
  }

  function clearFilters() {
    setSearchTerm("");
    setDateRangeStart("");
    setDateRangeEnd("");
    setSortBy("date_desc");
    setFilterType("");
    setFilterSensitive("");
  }

  function renderInterventionSection(
    name: string,
    interventions: Intervention[]
  ) {
    if (interventions.length === 0) return null;

    return (
      <>
        <h2 className={styles.subheading}>{name}</h2>
        <div className={styles.cardGrid}>
          {sortInterventions(interventions, sortBy).map((intervention) => (
  <InterventionCard
    key={intervention._id}
    intervention={intervention}
    onCardClick={router.push}
    onTogglePin={togglePin}
    onDelete={handleDelete}
    onEdit={handleEdit}
  />
))}

        </div>
      </>
    );
  }

  return (
    <div className={styles.InterventionTab}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Interventions</h1>
        <SectionExportButton type="interventions" label="Export CSV" />
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Search:</label>
            <input
              type="text"
              placeholder="Search by program name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date From:</label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date To:</label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sensitive:</label>
            <select
              value={filterSensitive}
              onChange={(e) => setFilterSensitive(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.resultsInfo}>
          Showing {filteredAndSortedInterventions.length} of{" "}
          {interventions.length} interventions
        </div>

        <button
          onClick={() => {
            setIsAdd(true);
            setIsEdit(false);
            setEditData(null);
            setIsModalOpen(true);
          }}
          className={styles.addButton}
        >
          + Add Intervention
        </button>
      </div>

      {pinnedPrograms.length > 0 && (
        <>
          <h2 className={styles.subheading}>Pinned Interventions</h2>
          <div className={styles.cardGrid}>
            {pinnedPrograms.map((program) => (
              <InterventionCard
                key={program._id}
                intervention={program}
                onCardClick={router.push}
                onTogglePin={togglePin}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </>
      )}

      {categorizedInterventions.map((section) => (
        <React.Fragment key={section.name}>
          {renderInterventionSection(section.name, section.data)}
        </React.Fragment>
      ))}

      <InterventionModal
        isOpen={isModalOpen}
        onCloseAction={resetModalState}
        intervention={editData || initialIntervention}
        isAdd={isAdd}
      />
    </div>
  );
}

function InterventionCard({
  intervention,
  onCardClick,
  onTogglePin,
  onDelete,
  onEdit,
}: {
  intervention: Intervention;
  onCardClick: (url: string) => void;
  onTogglePin: (intervention: Intervention, pinned: boolean) => void;
  onDelete: (intervention: Intervention) => void;
  onEdit: (intervention: Intervention) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div
      className={styles.card}
      onClick={() =>
        onCardClick(`/dashboard/interventions/${intervention._id}`)
      }
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.cardTitle}>{intervention.name}</h3>

          {intervention.description && (
            <div className={styles.descriptionContainer}>
              <p
                className={`${styles.cardDescription} ${
                  showFullDescription ? styles.expanded : ""
                }`}
              >
                {intervention.description}
              </p>
              {intervention.description.length > 100 && (
                <button
                  className={styles.seeMoreButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(!showFullDescription);
                  }}
                >
                  {showFullDescription ? "See less" : "See more"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.cardActions}>
          <button
            className={`${styles.pinButton} ${
              intervention.pinned ? styles.pinned : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(intervention, !intervention.pinned);
            }}
            name={intervention.pinned ? "Unpin" : "Pin"}
          >
            📌
          </button>

          <div className={styles.dropdown} ref={dropdownRef}>
            <button
              className={styles.dropdownButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              ⋮
            </button>

            {showDropdown && (
              <div className={styles.dropdownMenu}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(intervention);
                    setShowDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(intervention);
                    setShowDropdown(false);
                  }}
                  className={`${styles.dropdownItem} ${styles.deleteItem}`}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.dateSection}>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Date:</span>
            <span className={styles.dateValue}>
              {new Date(intervention.date).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </span>
          </div>
        </div>

        <div className={styles.metaSection}>
          <p className={styles.metaItem}>
            <strong>Type:</strong> {intervention.type}
          </p>
          <p className={styles.metaItem}>
            <strong>Sensitive:</strong> {intervention.sensitive ? "Yes" : "No"}
          </p>
          <p className={styles.lastModified}>
            Last Modified:{" "}
            {new Date(intervention.last_modified).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

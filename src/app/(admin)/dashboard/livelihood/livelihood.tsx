"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import styles from "./livelihood.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import LivelihoodModal from "./livelihood_modal";
import ViewLivelihood from "./viewLivelihood"; // Import your ViewLivelihood component
import { saveLivelihood, deleteLivelihood } from "@/lib/api/livelihoods";
import { Livelihood } from "@/types/livelihoods";
import { Transaction } from "@/types/transactions";
import SectionExportButton from "@/app/components/SectionExportButton";

const initialLivelihood: Livelihood = {
  name: "",
  date_created: new Date().toISOString(),
  transactions: [],
  last_modified: new Date().toISOString(),
  pinned: false,
};

const SORT_OPTIONS = [
  { value: "date_started_desc", label: "Start Date (Newest)" },
  { value: "date_started", label: "Start Date (Oldest)" },
  { value: "last_modified_desc", label: "Last Modified (Newest)" },
  { value: "last_modified", label: "Last Modified (Oldest)" },
  { value: "name", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

export default function LivelihoodTab() {
  const { livelihoods } = useDashboardData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState<Livelihood | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLivelihood, setSelectedLivelihood] =
    useState<Livelihood | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [sortBy, setSortBy] = useState("date_started_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [localPinnedState, setLocalPinnedState] = useState<
    Record<string, boolean>
  >({});

  const filteredAndSortedLivelihoods = useMemo(() => {
    const locallyUpdatedLivelihoods = livelihoods.map((item) => ({
      ...item,
      pinned: localPinnedState[item._id!] ?? item.pinned,
    }));

    let filtered = locallyUpdatedLivelihoods.filter((item) => {
      if (
        searchTerm &&
        !item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (dateRangeStart || dateRangeEnd) {
        const startDate = new Date(item.date_created);
        if (dateRangeStart && startDate < new Date(dateRangeStart))
          return false;
        if (dateRangeEnd && startDate > new Date(dateRangeEnd)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "date_started": // Oldest first
          return (
            new Date(a.date_created).getTime() -
            new Date(b.date_created).getTime()
          );
        case "date_started_desc": // Newest first
          return (
            new Date(b.date_created).getTime() -
            new Date(a.date_created).getTime()
          );
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
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    livelihoods,
    localPinnedState,
    searchTerm,
    dateRangeStart,
    dateRangeEnd,
    sortBy,
  ]);

  const pinnedPrograms = filteredAndSortedLivelihoods.filter((p) => p.pinned);

  const now = new Date();

  function resetModalState() {
    setIsModalOpen(false);
    setIsEdit(false);
    setIsAdd(false);
    setEditData(null);
  }

  function handleViewLivelihood(livelihood: Livelihood) {
    setSelectedLivelihood(livelihood);
    setIsViewModalOpen(true);
  }

  function handleCloseViewModal() {
    setIsViewModalOpen(false);
    setSelectedLivelihood(null);
  }

  const unpinnedLivelihoods = filteredAndSortedLivelihoods.filter(
    (i) => !i.pinned
  );

  async function togglePin(livelihood: Livelihood, pinned: boolean) {
    const id = livelihood._id!;
    setLocalPinnedState((prev) => ({ ...prev, [id]: pinned }));

    try {
      await saveLivelihood({ ...livelihood, pinned });
      mutate("/api/livelihood");
    } catch (err) {
      console.error("Failed to toggle pin", err);
      setLocalPinnedState((prev) => ({ ...prev, [id]: !pinned }));
    }
  }

  async function handleDelete(livelihood: Livelihood) {
    if (!livelihood._id) {
      console.error("No _id found on livelihood", livelihood);
      return;
    }

    if (
      window.confirm(`Are you sure you want to delete "${livelihood.name}"?`)
    ) {
      try {
        await deleteLivelihood(livelihood._id);
        mutate("/api/livelihood");
      } catch (err) {
        console.error("Failed to delete livelihood", err);
      }
    }
  }

  function handleEdit(livelihood: Livelihood) {
    setEditData(livelihood);
    setIsEdit(true);
    setIsModalOpen(true);
  }

  function clearFilters() {
    setSearchTerm("");
    setDateRangeStart("");
    setDateRangeEnd("");
    setSortBy("date_desc");
  }

  return (
    <div className={styles.LivelihoodTab}>

      <div className={styles.header}>

        <h1 className={styles.heading}>Livelihood</h1>
        <SectionExportButton type="livelihoods" label="Export CSV" />
</div>



        

        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search:</label>
              <input
                type="text"
                placeholder="Search by business name..."
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
          </div>
        </div>


        <div className={styles.headerActions}>
        
          <div className={styles.resultsInfo}>
        Showing {unpinnedLivelihoods.length} of {livelihoods.length} livelihoods
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
            + Add Livelihood
          </button>
        </div>



      {pinnedPrograms.length > 0 && (
        <>
          <h2 className={styles.subheading}>Pinned Livelihoods</h2>
          <div className={styles.cardGrid}>
            {pinnedPrograms.map((program) => (
              <LivelihoodCard
                key={program._id}
                livelihood={program}
                onCardClick={handleViewLivelihood}
                onTogglePin={togglePin}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </>
      )}
      <h2 className={styles.subheading}>All Livelihoods</h2>
      <div className={styles.cardGrid}>
        {unpinnedLivelihoods.map((livelihood) => (
          <LivelihoodCard
            key={livelihood._id}
            livelihood={livelihood}
            onCardClick={handleViewLivelihood}
            onTogglePin={togglePin}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <LivelihoodModal
        isOpen={isModalOpen}
        onCloseAction={resetModalState}
        livelihood={editData || initialLivelihood}
        isAdd={isAdd}
      />
      
      {selectedLivelihood && (
        <ViewLivelihood
          isOpen={isViewModalOpen}
          onCloseAction={handleCloseViewModal}
          livelihood={selectedLivelihood}
        />
      )}
    </div>
  );
}

function LivelihoodCard({
  livelihood,
  onCardClick,
  onDelete,
  onEdit,
  onTogglePin,
}: {
  livelihood: Livelihood;
  onCardClick: (livelihood: Livelihood) => void;
  onDelete: (livelihood: Livelihood) => void;
  onEdit: (livelihood: Livelihood) => void;
  onTogglePin: (livelihood: Livelihood, pinned: boolean) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
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

  const { transactions: allTransactions } = useDashboardData();

  const calculateStats = () => {
    const transactionIds = livelihood.transactions || [];

    const livelihoodTransactions = allTransactions.filter((t) =>
      transactionIds.includes(t._id)
    );

    const validTransactions = livelihoodTransactions
      .map((t) => ({
        ...t,
        price: Number(t.price),
        quantity: Number(t.quantity),
        type: t.type,
      }))
      .filter(
        (t): t is Transaction =>
          typeof t === "object" &&
          t !== null &&
          typeof t.type === "string" &&
          typeof t.name === "string" &&
          !isNaN(t.price) &&
          !isNaN(t.quantity) &&
          (t.date instanceof Date || typeof t.date === "string")
      );

    const expenses = validTransactions
      .filter((t) => t.type === "Expense")
      .reduce((total, t) => total + t.price * t.quantity, 0);

    const returns = validTransactions
      .filter((t) => t.type === "Return")
      .reduce((total, t) => total + t.price * t.quantity, 0);

    const netProfit = returns - expenses;
    const roi = expenses !== 0 ? (netProfit / expenses) * 100 : 0;

    return {
      expenses,
      returns,
      netProfit,
      roi: roi.toFixed(1),
    };
  };

  const stats = calculateStats();

  return (
    <div
      className={styles.businessCard}
      onClick={() => onCardClick(livelihood)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.businessName}>{livelihood.name}</h3>
        </div>

        <div className={styles.cardActions}>
          <button
            className={`${styles.pinButton} ${
              livelihood.pinned ? styles.pinned : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(livelihood, !livelihood.pinned);
            }}
            name={livelihood.pinned ? "Unpin" : "Pin"}
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
                    onEdit(livelihood);
                    setShowDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(livelihood);
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
        <div className={styles.businessInfo}>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(livelihood.date_created).toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}
          </p>
          <p className={styles.transactionCount}>
            <strong>Transactions:</strong>{" "}
            {livelihood.transactions?.length || 0}
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Expenses</span>
            <span className={styles.statValue}>
              ₱{stats.expenses.toLocaleString()}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Returns</span>
            <span className={styles.statValue}>
              ₱{stats.returns.toLocaleString()}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Profit</span>
            <span
              className={`${styles.statValue} ${
                stats.netProfit >= 0 ? styles.profit : styles.loss
              }`}
            >
              ₱{stats.netProfit.toLocaleString()}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>ROI</span>
            <span
              className={`${styles.statValue} ${
                parseFloat(stats.roi) >= 0 && stats.roi !== "Infinity"
                  ? styles.profit
                  : styles.loss
              }`}
            >
              {stats.roi}%
            </span>
          </div>
        </div>

        <div className={styles.clickHint}>Click to manage transactions</div>
      </div>
    </div>
  );
}

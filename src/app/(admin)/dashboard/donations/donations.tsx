"use client";
import React, { useState, useEffect } from "react";
import styles from "./donations.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { mutate } from "swr";
import { Donation } from "@/types/donations";
import { saveDonation, deleteDonation } from "@/lib/api/donations";
import SectionExportButton from "@/app/components/SectionExportButton";

const initialDonation: Donation = {
  date: "",
  isItem: false,
  name: "",
  value: 0,
  donor_name: "",
  contact_no: "",
};

export default function DonationsPage() {
  const { donations } = useDashboardData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingDonation, setIsAddingDonation] = useState(false);
  const [localDonations, setLocalDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Donation | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

const [filters, setFilters] = useState({
  startDate: "",
  endDate: "",
  minTotal: "", 
  maxTotal: "",
});

  const [newDonation, setNewDonation] = useState({
  date: new Date().toISOString().split("T")[0],
  isItem: false,
  name: "",
  value: "",
  donor_name: "",
  contact_no: "",
});

  // Sync donations from context to local state
  useEffect(() => {
    if (donations && Array.isArray(donations)) {
      setLocalDonations(donations);
    }
  }, [donations]);

  const resetDonation = () => {
    setNewDonation({
      date: new Date().toISOString().split("T")[0],
      isItem: false,
      name: "",
      value: "",
      donor_name: "",
      contact_no: "",
    });
  };

  const getFilteredItems = (items: Donation[]) => {
    return items
      .filter((donation) => {
        const donationDate = new Date(donation.date);

        const isAfterStart =
          !filters.startDate || donationDate >= new Date(filters.startDate);
        const isBeforeEnd =
          !filters.endDate || donationDate <= new Date(filters.endDate);
       const isAboveMin =
  !filters.minTotal || donation.value >= parseFloat(filters.minTotal);
const isBelowMax =
  !filters.maxTotal || donation.value <= parseFloat(filters.maxTotal);


        const matchesSearch =
          (donation.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (donation.donor_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        // Fixed filter type logic based on isItem boolean
        const matchesType =
          !filterType ||
          (filterType === "Item" && donation.isItem) ||
          (filterType === "Currency" && !donation.isItem);

        return (
          isAfterStart &&
          isBeforeEnd &&
          isAboveMin &&
          isBelowMax &&
          matchesSearch &&
          matchesType
        );
      })
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        const compare =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));

        return sortConfig.direction === "asc" ? compare : -compare;
      });
  };

  const filteredItems = Array.from(
  new Map(getFilteredItems(localDonations).map((d) => [d._id, d])).values()
);

  const addDonation = async (donationData: Omit<Donation, "_id">) => {
  setIsProcessing(true);
  try {
    const savedDonation = await saveDonation(donationData);
    setLocalDonations((prev) => [savedDonation, ...prev]);
    resetDonation();
    setIsAddingDonation(false);
    mutate("/api/donation");
  } catch (error : any) {
    console.error("Failed to save donation:", error);
    alert(error.message)
  } finally {
    setIsProcessing(false);
  }
};

  const handleConfirmAdd = () => {
  addDonation({
    ...newDonation,
    date: new Date(newDonation.date).toISOString(),
    value: parseFloat(newDonation.value),
  });
  mutate("/api/donation");
};

  const handleCancelAdd = () => {
    resetDonation();
    setIsAddingDonation(false);
  };

  const removeDonation = async (donationId: string) => {
    const previousDonations = localDonations;
    setLocalDonations((prev) => prev.filter((tx) => tx._id !== donationId));
    setIsProcessing(true);

    try {
      await deleteDonation(donationId);
      mutate("/api/donation");
    } catch (error) {
      console.error("Error removing donation:", error);
      setLocalDonations(previousDonations);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTableRow = (item: Donation) => {
    return (
      <tr key={item._id} className={styles.tableRow}>
        <td>{new Date(item.date).toLocaleDateString()}</td>
        <td>
          <input type="checkbox" checked={item.isItem} disabled />
        </td>

        <td className={!item.isItem ? styles.disabledInput : ""}>
          {item.isItem ? item.name : "N/A"}
        </td>

        <td>₱{parseFloat(String(item.value)).toFixed(2)}</td>
        <td>{item.donor_name}</td>
        <td>{item.contact_no}</td>

        <td>
          <button
            onClick={() => removeDonation(item._id || "")}
            className={styles.removeBtn}
            aria-label={`Remove ${item.name || "donation"}`}
          >
            Remove
          </button>
        </td>
      </tr>
    );
  };

  const renderNewDonationRow = () => {
    return (
      <tr className={styles.newDonationRow}>
        <td>
  <input
    type="date"
    value={newDonation.date}
    onChange={(e) =>
      setNewDonation((prev) => ({
        ...prev,
        date: e.target.value,
      }))
    }
    className={styles.inlineInput}
  />
</td>


        <td>
          <input
            type="checkbox"
            checked={newDonation.isItem}
            onChange={(e) =>
              setNewDonation((prev) => ({ ...prev, isItem: e.target.checked }))
            }
          />
        </td>

        <td>
          <input
            type="text"
            placeholder="Item name"
            value={newDonation.name}
            disabled={!newDonation.isItem}
            onChange={(e) =>
              setNewDonation((prev) => ({ ...prev, name: e.target.value }))
            }
            className={`${styles.inlineInput} ${
              !newDonation.isItem ? styles.disabledInput : ""
            }`}
          />
        </td>

        <td>
          <input
            type="number"
            placeholder="0.00"
            value={newDonation.value}
            onChange={(e) =>
              setNewDonation((prev) => ({ ...prev, value: e.target.value }))
            }
            className={styles.inlineInput}
            step="0.01"
            min="0"
          />
        </td>

        <td>
          <input
            type="text"
            placeholder="Donor name"
            value={newDonation.donor_name}
            onChange={(e) =>
              setNewDonation((prev) => ({
                ...prev,
                donor_name: e.target.value,
              }))
            }
            className={styles.inlineInput}
          />
        </td>

        <td>
          <input
            type="text"
            placeholder="Contact no."
            value={newDonation.contact_no}
            onChange={(e) =>
              setNewDonation((prev) => ({
                ...prev,
                contact_no: e.target.value,
              }))
            }
            className={styles.inlineInput}
          />
        </td>

        <td>
          <div className={styles.actionButtons}>
            <button
              onClick={handleConfirmAdd}
              className={styles.confirmBtn}
              disabled={
                isProcessing ||
                !newDonation.value ||
                !newDonation.donor_name ||
                !newDonation.contact_no ||
                (newDonation.isItem && !newDonation.name)
              }
            >
              ✓
            </button>
            <button
              onClick={handleCancelAdd}
              className={styles.cancelBtn}
              disabled={isProcessing}
            >
              ✕
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      minTotal: "",
      maxTotal: "",
    });
    setSearchTerm("");
    setFilterType("");
    setSortConfig({ key: null, direction: "asc" });
  };

  const handleSort = (key: keyof Donation) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className={styles.donationsPage}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Donations</h1>
        <SectionExportButton type="donations" label="Export CSV" />
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Search</label>
            <input
              type="text"
              placeholder="Search name or donor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All</option>
              <option value="Item">Item</option>
              <option value="Currency">Currency</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date From:</label>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className={styles.dateInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date To:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className={styles.dateInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <button onClick={resetFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Total Value Min (₱)</label>

            <input
              type="number"
              placeholder="Min"
              value={filters.minTotal}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minTotal: e.target.value,
                }))
              }
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Total Value Max (₱)</label>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxTotal}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxTotal: e.target.value,
                }))
              }
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>
      <div className={styles.donationHeader}>
        <div className={styles.resultsInfo}>
          Showing {filteredItems.length} of {localDonations.length} donation
          {localDonations.length !== 1 ? "s" : ""}
        </div>
        <button
          onClick={() => setIsAddingDonation(true)}
          disabled={isAddingDonation || isProcessing}
          className={styles.addDonationBtn}
        >
          Add Donation
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.donationsTable}>
          <thead className={styles.tableHead}>
            <tr>
              <th
                onClick={() => handleSort("date")}
                className={styles.sortableHeader}
              >
                Date
                {sortConfig.key === "date" && (
                  <span className={styles.sortIcon}>
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th>Item?</th>
              <th
                onClick={() => handleSort("name")}
                className={styles.sortableHeader}
              >
                Item Name
                {sortConfig.key === "name" && (
                  <span className={styles.sortIcon}>
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("value")}
                className={styles.sortableHeader}
              >
                Value
                {sortConfig.key === "value" && (
                  <span className={styles.sortIcon}>
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("donor_name")}
                className={styles.sortableHeader}
              >
                Donor
                {sortConfig.key === "donor_name" && (
                  <span className={styles.sortIcon}>
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {isAddingDonation && renderNewDonationRow()}
            {filteredItems.map((item) => renderTableRow(item))}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && !isAddingDonation && (
        <div className={styles.noResults}>
          <p>No donations found matching the current filters.</p>
          <button onClick={resetFilters} className={styles.resetFiltersBtn}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

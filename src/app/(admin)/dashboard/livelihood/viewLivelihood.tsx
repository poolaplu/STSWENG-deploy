"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./viewLivelihood.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { mutate } from "swr";
import { Livelihood } from "@/types/livelihoods";
import { Transaction } from "@/types/transactions";

type viewLivelihoodProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  livelihood: Livelihood;
};

export default function viewLivelihood({
  isOpen,
  onCloseAction,
  livelihood,
}: viewLivelihoodProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const { transactions } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction | null;
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

  useEffect(() => {
    const initial = transactions.filter((tx) =>
      livelihood.transactions.includes(tx._id)
    );
    setLocalTransactions(initial);
  }, [transactions, livelihood._id]);


  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString(),
    name: "",
    type: "",
    price: "",
    quantity: "1",
  });


  const resetTransaction = () => {
    setNewTransaction({ date: new Date().toISOString(), name: "", type: "", price: "", quantity: "1" });
  }

  const getFilteredItems = (items: Transaction[]) => {
    return items
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        const transactionTotal =
          parseFloat(String(transaction.price)) *
          parseFloat(String(transaction.quantity));

        const isAfterStart =
          !filters.startDate || transactionDate >= new Date(filters.startDate);
        const isBeforeEnd =
          !filters.endDate || transactionDate <= new Date(filters.endDate);
        const isAboveMin =
          !filters.minTotal || transactionTotal >= parseFloat(filters.minTotal);
        const isBelowMax =
          !filters.maxTotal || transactionTotal <= parseFloat(filters.maxTotal);

        const matchesSearch =
          transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.type.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = !filterType || transaction.type === filterType;

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

  const filteredItems = getFilteredItems(localTransactions);

  const addTransaction = async (transactionData: any) => {
    setIsProcessing(true);
    try {

      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...transactionData,
          livelihoodId: livelihood._id,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const newTransactionRecord = await response.json();
        await fetch(`/api/livelihood/${livelihood._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            $push: { transactions: newTransactionRecord._id },
          }),
        });

        livelihood.transactions.push(newTransactionRecord._id);
        setLocalTransactions((prev) => [newTransactionRecord, ...prev]);

        resetTransaction();
        mutate("/api/livelihood");
        mutate("/api/transaction");

        setIsAddingTransaction(false);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (
      newTransaction.name &&
      newTransaction.type &&
      newTransaction.price &&
      newTransaction.quantity
    ) {
      addTransaction(newTransaction);
      mutate('/api/transaction');
    }
  };

  const handleCancelAdd = () => {
    resetTransaction();
    setIsAddingTransaction(false);
  };

  const removeTransaction = async (transactionId: string) => {
    const previousTransactions = localTransactions;
    setLocalTransactions((prev) =>
      prev.filter((tx) => tx._id !== transactionId)
    );

    setIsProcessing(true);

    try {
      const deleteRes = await fetch(`/api/transaction/${transactionId}`, {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete transaction.");
      }
      const patchRes = await fetch(`/api/livelihood/${livelihood._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          $pull: { transactions: transactionId },
        }),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to update livelihood reference.");
      }

      mutate("/api/livelihood");
      mutate("/api/transaction");
    } catch (error) {
      console.error("Error removing transaction:", error);
      setLocalTransactions(previousTransactions);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTableRow = (item: Transaction) => {
    return (
      <tr key={item._id} className={styles.tableRow}>
        <td>{new Date(item.date).toLocaleDateString()}</td>
        <td>{item.name || ""}</td>
        <td>{item.type || ""}</td>
        <td>₱{parseFloat(String(item.price)).toFixed(2)}</td>
        <td>{item.quantity}</td>
        <td>
          <button
            onClick={() => removeTransaction(item._id || "")}
            className={styles.removeBtn}
            aria-label={`Remove ${item.name || ""} transaction`}
          >
            Remove
          </button>
        </td>
      </tr>
    );
  };
const renderNewTransactionRow = () => {
  return (
    <tr className={styles.newTransactionRow}>
      <td>
        <input
          type="date"
          value={newTransaction.date?.slice(0, 10) || new Date().toISOString().slice(0, 10)}
          onChange={(e) =>
            setNewTransaction((prev) => ({
              ...prev,
              date: e.target.value,
            }))
          }
          className={styles.inlineInput}
        />
      </td>
      <td>
        <input
          type="text"
          placeholder="Enter name..."
          value={newTransaction.name}
          onChange={(e) =>
            setNewTransaction((prev) => ({ ...prev, name: e.target.value }))
          }
          className={styles.inlineInput}
        />
      </td>
      <td>
        <select
          value={newTransaction.type}
          onChange={(e) =>
            setNewTransaction((prev) => ({ ...prev, type: e.target.value }))
          }
          className={styles.inlineInput}
        >
          <option value="">Select</option>
          <option value="Expense">Expense</option>
          <option value="Return">Return</option>
        </select>
      </td>
      <td>
        <input
          type="number"
          placeholder="0.00"
          value={newTransaction.price}
          onChange={(e) =>
            setNewTransaction((prev) => ({ ...prev, price: e.target.value }))
          }
          className={styles.inlineInput}
          step="0.01"
          min="0"
        />
      </td>
      <td>
        <input
          type="number"
          placeholder="1"
          value={newTransaction.quantity}
          onChange={(e) =>
            setNewTransaction((prev) => ({
              ...prev,
              quantity: e.target.value,
            }))
          }
          className={styles.inlineInput}
          min="1"
        />
      </td>
      <td>
        <div className={styles.actionButtons}>
          <button
            onClick={handleConfirmAdd}
            className={styles.confirmBtn}
            disabled={
              isProcessing ||
              !newTransaction.name ||
              !newTransaction.type ||
              !newTransaction.price ||
              !newTransaction.quantity
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

  const handleSort = (key: keyof Transaction) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
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
        <div className={styles.modalHeader}>
          <h3 id="modal-title" className={styles.modalTitle}>
            {livelihood.name}
          </h3>
          <button
            onClick={onCloseAction}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.filterSection}>
          <h4>Filters</h4>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search</label>
              <input
                type="text"
                placeholder="Search name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={styles.filterInput}
              >
                <option value="">All</option>
                <option value="Expense">Expense</option>
                <option value="Return">Return</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Date Range</label>
              <div className={styles.filterInputRange}>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className={styles.filterInput}
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className={styles.filterInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                Total Price Range (₱)
              </label>
              <div className={styles.filterInputRange}>
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
                  className={styles.filterInput}
                />
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
                  className={styles.filterInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <button onClick={resetFilters} className={styles.resetBtn}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className={styles.transactionHeader}>
          <div className={styles.resultsCount}>
            {filteredItems.length} transaction
            {filteredItems.length !== 1 ? "s" : ""} found
          </div>
          <button
            onClick={() => setIsAddingTransaction(true)}
            disabled={isAddingTransaction || isProcessing}
            className={styles.addTransactionBtn}
          >
            Add Transaction
          </button>
        </div>

        <div className={styles.modalTableContainer}>
          <table className={styles.modalTable}>
            <thead className={styles.modalTableHead}>
              <tr>
                <th onClick={() => handleSort("date")}>
                  Date
                  {sortConfig.key === "date" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("name")}>
                  Name
                  {sortConfig.key === "name" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("type")}>
                  Type
                  {sortConfig.key === "type" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("price")}>
                  Price
                  {sortConfig.key === "price" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("quantity")}>
                  Quantity
                  {sortConfig.key === "quantity" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody className={styles.modalTableBody}>
              {isAddingTransaction && renderNewTransactionRow()}
              {filteredItems.map((item) => renderTableRow(item))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && !isAddingTransaction && (
          <div className={styles.noResults}>
            No transactions found matching the current filters.
          </div>
        )}

        <div className={styles.modalActions}>
          <div className={styles.modalButtonGroup}>
            <button
              onClick={onCloseAction}
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

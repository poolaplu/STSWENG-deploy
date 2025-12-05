"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useDashboardData } from "@/utils/DashboardContext";
import { Member } from "@/types/members";
import { Intervention } from "@/types/interventions";
import styles from "./interventionid.module.css";
import useSWR from "swr";
import AddExistingModal from "./addExisting";
import CreateModal from "./createNew";
import { mutate } from "swr";
import { Transaction } from "@/types/transactions";
import { Household } from "@/types/households";
import cluster from "cluster";

export const initialMember: Member = {
    last_name: "",
    first_name: "",
    sex: "",
    birthdate: "",
    weight: "",
    contact_number: "",
    marital_status: "Single",
    partner: undefined,
    occupation: "Unemployed",
    guardians: [],
    household: undefined,
    general_notes: "",
    sensitive_notes: "",
};

export function useinterventionById(id: string) {
    return useSWR(id ? `/api/intervention/${id}` : null, (url) => fetch(url).then((res) => res.json()));
}

interface BeneficiaryWithType {
    item: Member | Household | string;
    type: "Member" | "Household" | "Cluster";
}

export default function InterventionID() {
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : "";
    const { members, households } = useDashboardData();
    const { transactions } = useDashboardData();

    const [currentIntervention, setCurrentIntervention] = useState<Intervention | null>(null);
    const { data: intervention, mutate: mutateIntervention } = useinterventionById(id);
    const [showAddExisting, setShowAddExisting] = useState(false);
    const [showCreateNew, setShowCreateNew] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
    const [addingExpenditure, setAddingExpenditure] = useState(false);
    const [newExpenditure, setNewExpenditure] = useState({
        name: "",
        price: "",
        quantity: "",
        date: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (intervention) {
            setCurrentIntervention(intervention);
        }
    }, [intervention]);

    const allBeneficiaries = useMemo(() => {
        if (!currentIntervention || !members) return [];

        const beneficiaries: BeneficiaryWithType[] = [];

        if (Array.isArray(currentIntervention.beneficiaries_member)) {
            const memberBens = members
                .filter((m) => currentIntervention.beneficiaries_member?.includes(m._id))
                .map((member) => ({ item: member, type: "Member" as const }));
            beneficiaries.push(...memberBens);
        }

        if (Array.isArray(currentIntervention.beneficiaries_household)) {
            const householdBens = households
                .filter((h) => currentIntervention.beneficiaries_household?.includes(h._id))
                .map((household) => ({
                    item: household,
                    type: "Household" as const,
                }));
            beneficiaries.push(...householdBens);
        }

        if (Array.isArray(currentIntervention.beneficiaries_cluster)) {
            const rawClusters = currentIntervention.beneficiaries_cluster.map((clusterName) => ({
                item: clusterName,
                type: "Cluster" as const,
            }));
            beneficiaries.push(...rawClusters);
        }

        return beneficiaries;
    }, [currentIntervention, members, households]);

    const interventionTransactions = useMemo(() => {
        if (!transactions || !currentIntervention) return [];

        return transactions.filter((t: Transaction) =>
            currentIntervention.expenditures?.some((expId) => expId.toString() === t._id?.toString())
        );
    }, [transactions, currentIntervention]);

    const totalExpenditure = useMemo(() => {
        return interventionTransactions.reduce((total: number, transaction: Transaction) => {
            return total + transaction.price * transaction.quantity;
        }, 0);
    }, [interventionTransactions]);

    const handleAddExpenditure = async () => {
        if (!newExpenditure.name || !newExpenditure.price || !newExpenditure.quantity) {
            alert("Please fill in all fields");
            return;
        }

        setIsProcessing(true);
        try {
            const transaction = {
                name: newExpenditure.name,
                price: parseFloat(newExpenditure.price),
                quantity: parseInt(newExpenditure.quantity),
                date: new Date(newExpenditure.date),
                type: "Expense",
            };

            const res = await fetch(`/api/intervention/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transaction,
                }),
            });

            if (!res.ok) throw new Error("Failed to patch intervention");

            setNewExpenditure({
                name: "",
                price: "",
                quantity: "",
                date: new Date().toISOString().split("T")[0],
            });
            setAddingExpenditure(false);
            mutateIntervention();
            mutate("/api/transaction");
        } catch (err) {
            console.error("Add expenditure error:", err);
            alert("Error adding expenditure.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!transactions || !intervention) return;

        const previousTransactions = [...transactions];
        const previousExpenditures = [...(intervention.expenditures || [])];

        const updatedTransactions = transactions.filter((t: Transaction) => t._id !== transactionId);
        const updatedExpenditures = previousExpenditures.filter((id) => id !== transactionId);
        mutate("/api/transaction");
        mutateIntervention({ ...intervention, expenditures: updatedExpenditures }, false);

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/transaction/${transactionId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Delete failed");

            const patchResponse = await fetch(`/api/intervention/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    removeExpenditureId: transactionId,
                }),
            });

            if (!patchResponse.ok) throw new Error("Failed to update intervention expenditures");

            // Revalidate both
            mutate("/api/transaction");
            mutateIntervention();
        } catch (err) {
            alert("Failed to delete transaction. Rolling back.");

            mutate("/api/transaction");
            mutateIntervention({ ...intervention, expenditures: previousExpenditures }, false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditTransaction = async (transactionId: string, updatedData: Partial<Transaction>) => {
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/transaction/${transactionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                setEditingTransaction(null);
                mutate("/api/transaction");
            } else {
                alert("Failed to update expenditure");
            }
        } catch (error) {
            alert("Error updating expenditure");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveBeneficiary = async (beneficiary: BeneficiaryWithType) => {
        if (!intervention || !beneficiary) return;

        const idToRemove =
            beneficiary.type === "Cluster" ? beneficiary.item : (beneficiary.item as Member | Household)._id;

        const optimisticUpdate = { ...intervention };

        // Prepare rollback state
        const previousBeneficiaries = {
            member: [...(intervention.beneficiaries_member || [])],
            household: [...(intervention.beneficiaries_household || [])],
            cluster: [...(intervention.beneficiaries_cluster || [])],
        };

        // Apply local optimistic update
        if (beneficiary.type === "Member") {
            optimisticUpdate.beneficiaries_member = previousBeneficiaries.member.filter(
                (id) => id !== idToRemove
            );
        } else if (beneficiary.type === "Household") {
            optimisticUpdate.beneficiaries_household = previousBeneficiaries.household.filter(
                (hh) => hh !== idToRemove
            );
        } else if (beneficiary.type === "Cluster") {
            optimisticUpdate.beneficiaries_cluster = previousBeneficiaries.cluster.filter(
                (name) => name !== idToRemove
            );
        }

        // Optimistically update the UI
        mutateIntervention(optimisticUpdate, false);

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/intervention/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    removeMemberId: beneficiary.type === "Member" ? idToRemove : undefined,
                    removeHouseholdId: beneficiary.type === "Household" ? idToRemove : undefined,
                    removeClusterName: beneficiary.type === "Cluster" ? idToRemove : undefined,
                }),
            });

            if (!res.ok) throw new Error("Failed to delete");

            // Success: revalidate
            mutateIntervention();
        } catch (err) {
            alert("Failed to delete. Rolling back.");

            // Rollback
            mutateIntervention(
                {
                    ...intervention,
                    beneficiaries_member: previousBeneficiaries.member,
                    beneficiaries_household: previousBeneficiaries.household,
                    beneficiaries_cluster: previousBeneficiaries.cluster,
                },
                false
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.interventionDetailsContainer}>
            <div className={styles.programDetailsCard}>
                <h1 className={styles.programTitle}>{currentIntervention?.name}</h1>
                <div className={styles.programInfoGrid}>
                    <div>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Description:</span>
                            <span className={styles.programInfoValue}>
                                {currentIntervention?.description}
                            </span>
                        </p>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Date:</span>
                            <span className={styles.programInfoValue}>
                                {currentIntervention?.date
                                    ? new Date(currentIntervention.date).toLocaleDateString("en-US", {
                                          dateStyle: "medium",
                                      })
                                    : "N/A"}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Last Modified:</span>
                            <span className={styles.programInfoValue}>
                                {new Date(currentIntervention?.last_modified || "").toLocaleString("en-US", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.beneficiariesContainer}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>Expenditures ({interventionTransactions.length})</h2>
                    <button
                        onClick={() => setAddingExpenditure(true)}
                        className={styles.addBeneficiaryBtn}
                        disabled={isProcessing || addingExpenditure}
                        aria-label="Add new expenditure">
                        {isProcessing ? "Processing..." : "Add Expenditure"}
                    </button>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.beneficiariesTable}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th>Date</th>
                                <th>Item Name</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {addingExpenditure && (
                                <tr>
                                    <td>
                                        <input
                                            type="date"
                                            value={newExpenditure.date}
                                            onChange={(e) =>
                                                setNewExpenditure((prev) => ({
                                                    ...prev,
                                                    date: e.target.value,
                                                }))
                                            }
                                            className={styles.inputField}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Item name"
                                            value={newExpenditure.name}
                                            onChange={(e) =>
                                                setNewExpenditure((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            className={styles.inputField}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            step="0.01"
                                            value={newExpenditure.price}
                                            onChange={(e) =>
                                                setNewExpenditure((prev) => ({
                                                    ...prev,
                                                    price: e.target.value,
                                                }))
                                            }
                                            className={styles.inputField}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            placeholder="Quantity"
                                            value={newExpenditure.quantity}
                                            onChange={(e) =>
                                                setNewExpenditure((prev) => ({
                                                    ...prev,
                                                    quantity: e.target.value,
                                                }))
                                            }
                                            className={styles.inputField}
                                        />
                                    </td>
                                    <td>
                                        {newExpenditure.price && newExpenditure.quantity
                                            ? (
                                                  parseFloat(newExpenditure.price) *
                                                  parseInt(newExpenditure.quantity)
                                              ).toFixed(2)
                                            : "0.00"}
                                    </td>
                                    <td>
                                        <button
                                            onClick={handleAddExpenditure}
                                            className={styles.confirmBtn}
                                            disabled={isProcessing}>
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAddingExpenditure(false);
                                                setNewExpenditure({
                                                    name: "",
                                                    price: "",
                                                    quantity: "",
                                                    date: new Date().toISOString().split("T")[0],
                                                });
                                            }}
                                            className={styles.cancelBtn}
                                            disabled={isProcessing}>
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {interventionTransactions.length === 0 && !addingExpenditure ? (
                                <tr>
                                    <td colSpan={6} className={styles.emptyState}>
                                        No expenditures yet.
                                    </td>
                                </tr>
                            ) : (
                                interventionTransactions.map((transaction: Transaction) => (
                                    <tr key={transaction._id}>
                                        <td>
                                            {editingTransaction === transaction._id ? (
                                                <input
                                                    type="date"
                                                    defaultValue={
                                                        new Date(transaction.date).toISOString().split("T")[0]
                                                    }
                                                    onBlur={(e) =>
                                                        handleEditTransaction(transaction._id!, {
                                                            date: new Date(e.target.value).toISOString(),
                                                        })
                                                    }
                                                    className={styles.inputField}
                                                />
                                            ) : (
                                                <span onClick={() => setEditingTransaction(transaction._id!)}>
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {editingTransaction === transaction._id ? (
                                                <input
                                                    type="text"
                                                    defaultValue={transaction.name}
                                                    onBlur={(e) =>
                                                        handleEditTransaction(transaction._id!, {
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    className={styles.inputField}
                                                />
                                            ) : (
                                                <span onClick={() => setEditingTransaction(transaction._id!)}>
                                                    {transaction.name}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {editingTransaction === transaction._id ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={transaction.price}
                                                    onBlur={(e) =>
                                                        handleEditTransaction(transaction._id!, {
                                                            price: parseFloat(e.target.value),
                                                        })
                                                    }
                                                    className={styles.inputField}
                                                />
                                            ) : (
                                                <span onClick={() => setEditingTransaction(transaction._id!)}>
                                                    ₱{transaction.price.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {editingTransaction === transaction._id ? (
                                                <input
                                                    type="number"
                                                    defaultValue={transaction.quantity}
                                                    onBlur={(e) =>
                                                        handleEditTransaction(transaction._id!, {
                                                            quantity: parseInt(e.target.value),
                                                        })
                                                    }
                                                    className={styles.inputField}
                                                />
                                            ) : (
                                                <span onClick={() => setEditingTransaction(transaction._id!)}>
                                                    {transaction.quantity}
                                                </span>
                                            )}
                                        </td>
                                        <td>₱{(transaction.price * transaction.quantity).toFixed(2)}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteTransaction(transaction._id!)}
                                                className={styles.cancelBtn}
                                                disabled={isProcessing}
                                                aria-label="Delete expenditure">
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {interventionTransactions.length > 0 && (
                            <tfoot>
                                <tr className={styles.totalRow}>
                                    <td colSpan={4} className={styles.totalLabel}>
                                        <strong>Total Expenditure:</strong>
                                    </td>
                                    <td className={styles.totalAmount}>
                                        <strong>₱{totalExpenditure.toFixed(2)}</strong>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <div className={styles.beneficiariesContainer}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>Beneficiaries ({allBeneficiaries.length})</h2>
                    <button
                        onClick={() => setShowCreateNew(true)}
                        className={styles.addBeneficiaryBtn}
                        disabled={isProcessing}
                        aria-label="Create new beneficiaries to the program">
                        {isProcessing ? "Processing..." : "Create New"}
                    </button>
                    <button
                        onClick={() => setShowAddExisting(true)}
                        className={styles.addBeneficiaryBtn}
                        disabled={isProcessing}
                        aria-label="Add new beneficiaries to the program">
                        {isProcessing ? "Processing..." : "Add Existing"}
                    </button>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.beneficiariesTable}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {allBeneficiaries.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className={styles.emptyState}>
                                        No beneficiaries yet.
                                    </td>
                                </tr>
                            ) : (
                                allBeneficiaries.map((beneficiary, index) => {
                                    let displayName: string;

                                    if (
                                        beneficiary.type === "Member" &&
                                        typeof beneficiary.item !== "string"
                                    ) {
                                        const member = beneficiary.item as Member;
                                        displayName = `${member.first_name} ${member.last_name}`;
                                    } else if (
                                        beneficiary.type === "Household" &&
                                        typeof beneficiary.item !== "string"
                                    ) {
                                        const household = beneficiary.item as Household;
                                        displayName = household.name;
                                    } else {
                                        // Cluster, assumed to be string
                                        displayName = beneficiary.item as string;
                                    }

                                    return (
                                        <tr key={`${displayName}-${beneficiary.type}-${index}`}>
                                            <td>{displayName}</td>
                                            <td>{beneficiary.type}</td>
                                            <td>
                                                <button
                                                    className={styles.cancelBtn}
                                                    onClick={() => handleRemoveBeneficiary(beneficiary)}
                                                    disabled={isProcessing}
                                                    aria-label="Remove beneficiary">
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AddExistingModal isOpen={showAddExisting} onCloseAction={() => setShowAddExisting(false)} />

            <CreateModal
                isOpen={showCreateNew}
                onCloseAction={() => setShowCreateNew(false)}
                isAdd={true}
                member={initialMember}
            />
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./feedingid.module.css";
import { useDashboardData } from "@/utils/DashboardContext";
import { Member } from "@/types/members";
import { Feeding, FeedingChild } from "@/types/feedings";
import AddExistingModal from "./addExisting";
import CreateModal from "./createNew";
import useSWR from "swr";

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

export const initialFeeding: Feeding = {
    name: "",
    description: "",
    date_started: new Date().toISOString(),
    date_ended: undefined,
    last_modified: new Date().toISOString(),
    status: "To Be Done",
    beneficiaries: [],
    pinned: false,
    _isNew: true,
};

export const initialFeedingChild: FeedingChild = {
    idMember: "",
    weight_initial: 0,
    height_initial: 0,
    weight_third: 0,
    height_third: 0,
    weight_sixth: 0,
    height_sixth: 0,
    weight_ninth: 0,
    height_ninth: 0,
    weight_twelvth: 0,
    height_twelvth: 0,
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useFeedingById(id: string) {
    const { data, error, isLoading } = useSWR(id ? `/api/feeding/${id}` : null, fetcher);
    return { data, error, isLoading };
}

export default function FeedingProgramID() {
    const params = useParams();
    const id = typeof params.id === "string" ? params.id : "";
    const [program, setProgram] = useState<Feeding | null>(null);
    const { members: membersRows } = useDashboardData();
    const { data: feeding } = useFeedingById(id);
    const [feedingChildren, setFeedingChildren] = useState<FeedingChild[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isAdd, setIsAdd] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [viewId, setViewId] = useState<Member | null>(null);

    useEffect(() => {
        if (feeding) {
            setProgram(feeding);
            if (feeding.beneficiaries && Array.isArray(feeding.beneficiaries)) {
                setFeedingChildren(feeding.beneficiaries);
            }
        }
    }, [feeding]);

    const removeBeneficiary = async (childId: string) => {
        if (!program?._id) return;

        const childToRemove = feedingChildren.find((child) => child._id === childId);
        if (!childToRemove) return;
        setFeedingChildren((prev) => prev.filter((child) => child._id !== childId));
        setProgram((prev) =>
            prev
                ? {
                      ...prev,
                      beneficiaries: (prev.beneficiaries || []).filter((id) => id._id !== childId),
                  }
                : null
        );

        try {
            setIsProcessing(true);
            const removeRes = await fetch(`/api/feeding/${program._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feedingChildId: childId,
                    action: "remove",
                }),
            });

            if (!removeRes.ok) {
                throw new Error("Failed to remove beneficiary from program");
            }
            const deleteRes = await fetch(`/api/feeding/child/${childId}`, {
                method: "DELETE",
            });

            if (!deleteRes.ok) {
                console.warn("Failed to delete FeedingChild record, but removed from program");
            }
        } catch (error) {
            console.error("Error removing beneficiary:", error);
            alert("Failed to remove beneficiary. Rolling back...");

            setFeedingChildren((prev) => [...prev, childToRemove]);
            setFeedingChildren((prev) => [...prev, childToRemove]);
            setProgram((prev) =>
                prev
                    ? {
                          ...prev,
                          beneficiaries: [...(prev.beneficiaries || []), childToRemove],
                      }
                    : null
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInputChange = (childId: string, field: string, value: number | string) => {
        setFeedingChildren((prev) =>
            prev.map((child) => (child._id === childId ? { ...child, [field]: value } : child))
        );
    };

    const updateMeasurement = async (childId: string, field: string, value: number | string) => {
        try {
            const res = await fetch(`/api/feeding/child/${childId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });

            if (!res.ok) throw new Error("Failed to update");
        } catch (err) {
            console.error("Error updating measurement:", err);
        }
    };

    const calculateAge = (birthdate: string) => {
        if (!birthdate) return undefined;
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleShowModal = (member: Member, bool: boolean) => {
        setViewId(member);
        setShowMemberModal(true);
        setIsAdd(bool);
    };

    const resetModalState = () => {
        setViewId(initialMember);
        setShowMemberModal(false);
        setIsAdd(false);
    };

    const calculateBMI = (
    weight?: number,
    height?: number,
    age?: number,
    sex?: string
): { bmi: number | null; category: string; color: string } => {
    if (!weight || !height || weight <= 0 || height <= 0) {
        return { bmi: null, category: "No data", color: "#999" };
    }

    const heightInMeters = height > 3 ? height / 100 : height;
    const bmi = weight / (heightInMeters * heightInMeters);
    const roundedBMI = Math.round(bmi * 10) / 10;

    if (age && age < 18 && sex) {
        let category = "";
        let color = "";

        if (sex === "M") {
            if (roundedBMI < 14) {
                category = "Underweight";
                color = "#3b82f6";
            } else if (roundedBMI < 19) {
                category = "Normal";
                color = "#10b981";
            } else if (roundedBMI < 21) {
                category = "Overweight";
                color = "#f59e0b";
            } else {
                category = "Obese";
                color = "#ef4444";
            }
        } else if (sex === "F") {
            if (roundedBMI < 13.5) {
                category = "Underweight";
                color = "#3b82f6";
            } else if (roundedBMI < 18.5) {
                category = "Normal";
                color = "#10b981";
            } else if (roundedBMI < 20.5) {
                category = "Overweight";
                color = "#f59e0b";
            } else {
                category = "Obese";
                color = "#ef4444";
            }
        } else {
            category = "Unknown";
            color = "#999";
        }

        return { bmi: roundedBMI, category, color };
    }

    let category = "";
    let color = "";

    if (bmi < 18.5) {
        category = "Underweight";
        color = "#3b82f6";
    } else if (bmi < 25) {
        category = "Normal";
        color = "#10b981";
    } else if (bmi < 30) {
        category = "Overweight";
        color = "#f59e0b";
    } else {
        category = "Obese";
        color = "#ef4444";
    }

    return { bmi: roundedBMI, category, color };
};


    const renderBMIRemarks = (
    weight?: number,
    height?: number,
    birthdate?: string,
    sex?: string
) => {
    const age = birthdate ? calculateAge(birthdate) : undefined;
    const { bmi, category, color } = calculateBMI(weight, height, age, sex);

    if (!bmi) {
        return (
            <div className={styles.bmiRemarks}>
                <span className={styles.bmiValue}>--</span>
                <span className={styles.bmiCategory} style={{ color: "#999" }}>
                    No data
                </span>
            </div>
        );
    }

    return (
        <div className={styles.bmiRemarks}>
            <span className={styles.bmiValue}>BMI: {bmi}</span>
            <span className={styles.bmiCategory} style={{ color }}>
                {category}
            </span>
        </div>
    );
};

    return (
        <div className={styles.feedingDetailsContainer}>
            <div className={styles.programDetailsCard}>
                <h1 className={styles.programTitle}>{program?.name}</h1>
                <div className={styles.programInfoGrid}>
                    <div>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Description:</span>
                            <span className={styles.programInfoValue}>{program?.description}</span>
                        </p>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Start Date:</span>
                            <span className={styles.programInfoValue}>
                                {program?.date_started
                                    ? new Date(program?.date_started).toLocaleDateString("en-US", {
                                          dateStyle: "medium",
                                      })
                                    : "N/A"}
                            </span>
                        </p>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>End Date:</span>
                            <span className={styles.programInfoValue}>
                                {program?.date_ended
                                    ? new Date(program?.date_ended).toLocaleDateString("en-US", {
                                          dateStyle: "medium",
                                      })
                                    : "N/A"}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Status:</span>
                            <span className={styles.programInfoValue}>{program?.status}</span>
                        </p>
                        <p className={styles.programInfoItem}>
                            <span className={styles.programInfoLabel}>Last Modified:</span>
                            <span className={styles.programInfoValue}>
                                {new Date(program?.last_modified || "").toLocaleString("en-US", {
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
                    <h2 className={styles.tableTitle}>Beneficiaries ({feedingChildren.length})</h2>
                    <button
                        onClick={() => handleShowModal(initialMember, true)}
                        className={styles.addBeneficiaryBtn}
                        disabled={isProcessing}
                        aria-label="Create new beneficiaries to the program">
                        {isProcessing ? "Processing..." : "Create New"}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
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
                                <th>Initial (W/H)</th>
                                <th>3rd Month (W/H)</th>
                                <th>6th Month (W/H)</th>
                                <th>9th Month (W/H)</th>
                                <th>12th Month (W/H)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {feedingChildren.length === 0 || !membersRows || membersRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.emptyState}>
                                        {feedingChildren.length === 0
                                            ? 'No beneficiaries added yet. Click "Add Beneficiary" to get started.'
                                            : "Loading members..."}
                                    </td>
                                </tr>
                            ) : (
                                feedingChildren.map((child) => {
                                    const member = membersRows?.find((m) => {
                                        if (typeof child.idMember === "string") {
                                            return m._id === child.idMember;
                                        } else {
                                            return m._id === child.idMember._id;
                                        }
                                    });

                                    return (
                                        <tr key={child._id} className={styles.tableRow}>
                                            <td className={styles.tableCell}>
                                                <span
                                                    className={styles.memberName}
                                                    onClick={() => {
                                                        handleShowModal(member, false);
                                                    }}>
                                                    {member
                                                        ? `${member.first_name} ${member.last_name}`
                                                        : "Unknown"}
                                                </span>
                                                {member && (
                                                    <div className={styles.memberSubInfo}>
                                                        Age: {calculateAge(member.birthdate) || "N/A"} •{" "}
                                                        {member.sex || "N/A"}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.measurementInputs}>
                                                    <input
                                                        type="number"
                                                        placeholder="Weight (KG)"
                                                        value={child.weight_initial || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "weight_initial",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "weight_initial",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Initial weight measurement"
                                                    />

                                                    <input
                                                        type="number"
                                                        placeholder="Height (CM)"
                                                        value={child.height_initial || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "height_initial",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "height_initial",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Initial height measurement"
                                                    />
                                                    {renderBMIRemarks(child.weight_initial, child.height_initial, member?.birthdate, member?.sex)}

                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.measurementInputs}>
                                                    <input
                                                        type="number"
                                                        placeholder="Weight (KG)"
                                                        value={child.weight_third || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "weight_third",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "weight_third",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Third month weight measurement"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Height (CM)"
                                                        value={child.height_third || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "height_third",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "height_third",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Third month height measurement"
                                                    />

                                                    {renderBMIRemarks(child.weight_third, child.height_third, member?.birthdate, member?.sex)}

                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.measurementInputs}>
                                                    <input
                                                        type="number"
                                                        placeholder="Weight (KG)"
                                                        value={child.weight_sixth || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "weight_sixth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "weight_sixth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Sixth month weight measurement"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Height (CM)"
                                                        value={child.height_sixth || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "height_sixth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "height_sixth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Sixth month height measurement"
                                                    />
                                                    {renderBMIRemarks(child.weight_sixth, child.height_sixth, member?.birthdate, member?.sex)}
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.measurementInputs}>
                                                    <input
                                                        type="number"
                                                        placeholder="Weight (KG)"
                                                        value={child.weight_ninth || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "weight_ninth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "weight_ninth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Ninth month weight measurement"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Height (CM)"
                                                        value={child.height_ninth || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "height_ninth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "height_ninth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Ninth month height measurement"
                                                    />
                                                    {renderBMIRemarks(child.weight_ninth, child.height_ninth, member?.birthdate, member?.sex)}
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.measurementInputs}>
                                                    <input
                                                        type="number"
                                                        placeholder="Weight (KG)"
                                                        value={child.weight_twelvth || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "weight_twelvth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "weight_twelvth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Twelfth month weight measurement"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Height (CM)"
                                                        value={child.height_twelvth || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                child._id!,
                                                                "height_twelvth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            updateMeasurement(
                                                                child._id!,
                                                                "height_twelvth",
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                        className={styles.measurementInput}
                                                        aria-label="Twelfth month height measurement"
                                                    />
                                                    {renderBMIRemarks(
                                                        child.weight_twelvth,
                                                        child.height_twelvth,
                                                        member?.birthdate,
                                                        member?.sex
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <button
                                                    onClick={() => removeBeneficiary(child._id!)}
                                                    className={styles.removeBtn}
                                                    disabled={isProcessing}
                                                    aria-label={`Remove ${
                                                        member
                                                            ? `${member.first_name} ${member.last_name}`
                                                            : "this member"
                                                    } from the program`}>
                                                    Remove
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

            <AddExistingModal isOpen={showAddModal} onCloseAction={() => setShowAddModal(false)} />

            <CreateModal
                isOpen={showMemberModal}
                onCloseAction={resetModalState}
                isAdd={isAdd}
                member={viewId || initialMember}
            />
        </div>
    );
}

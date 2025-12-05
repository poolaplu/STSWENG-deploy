"use client";
import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import styles from "./programs.module.css";
import ProgramModal from "./program_modal";
import { Program } from "@/types/programs";
import { deleteProgram } from "@/lib/api/programs";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const initialProgram: Program = {
  title: "", description: "", fullDescription: "", category: "Outreach", location: "", imageUrl: "", objectives: [], activities: []
};

export default function ProgramsTab() {
  const { data: programs = [], error } = useSWR("/api/programs", fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [editData, setEditData] = useState<Program | null>(null);

  function handleEdit(program: Program) {
    setEditData(program);
    setIsAdd(false);
    setIsModalOpen(true);
  }

  async function handleDelete(program: Program) {
    if (confirm(`Delete "${program.title}"?`)) {
      await deleteProgram(program._id!);
      mutate("/api/programs");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Programs</h1>
        <button onClick={() => { setIsAdd(true); setEditData(null); setIsModalOpen(true); }} className={styles.addButton}>
          + Add Program
        </button>
      </div>

      <div className={styles.cardGrid}>
        {programs.map((program: Program) => (
          <div key={program._id} className={styles.card}>
            {program.imageUrl && <img src={program.imageUrl} alt={program.title} className={styles.cardImage} />}
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{program.title}</h3>
              <div className={styles.cardMeta}>
                <span className={styles.badge}>{program.category}</span>
                <span className={styles.badge}>{program.location}</span>
              </div>
              <p className={styles.cardDesc}>{program.description.slice(0, 80)}...</p>
              <div className={styles.cardActions}>
                <button onClick={() => handleEdit(program)} className={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(program)} className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProgramModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          program={editData || initialProgram}
          isAdd={isAdd}
        />
      )}
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import styles from "./programs.module.css";
import { Program } from "@/types/programs";
import { saveProgram, updateProgram } from "@/lib/api/programs";
import { mutate } from "swr";

interface ProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    program: Program;
    isAdd: boolean;
}

export default function ProgramModal({ isOpen, onClose, program, isAdd }: ProgramModalProps) {
    const [formData, setFormData] = useState<Program>(program);
    
    const [objText, setObjText] = useState("");
    const [actText, setActText] = useState("");
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFormData(program);
        setObjText(program.objectives?.join('\n') || "");
        setActText(program.activities?.join('\n') || "");
    }, [program]);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) { 
                alert("File too large! Max 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            alert("Title and short description are required.");
            return;
        }

        setLoading(true);
        try {
            const payload: Program = {
                ...formData,
                objectives: objText.split('\n').filter(line => line.trim() !== ""),
                activities: actText.split('\n').filter(line => line.trim() !== ""),
            };

            if (isAdd) {
                await saveProgram(payload);
            } else {
                await updateProgram(formData._id!, payload);
            }

            mutate("/api/programs"); 
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving program");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>{isAdd ? "Create Program" : "Edit Program"}</h2>

                <label className={styles.label}>Title</label>
                <input className={styles.input} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label className={styles.label}>Category</label>
                        <select className={styles.select} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                            <option>Outreach</option>
                            <option>Education</option>
                            <option>Health</option>
                            <option>Livelihood</option>
                        </select>
                    </div>
                    <div>
                        <label className={styles.label}>Location</label>
                        <input className={styles.input} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                </div>

                <label className={styles.label}>Program Image</label>
                <div style={{ border: '1px dashed #ccc', padding: '10px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('prog-img')?.click()}>
                    {formData.imageUrl ? (
                        <div style={{ position: 'relative' }}>
                            <img src={formData.imageUrl} alt="Preview" style={{ height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                            <p style={{ fontSize: '12px', color: 'green', marginTop: '5px' }}>Click to change</p>
                        </div>
                    ) : (
                        <p style={{ color: '#666', fontSize: '14px' }}>+ Upload Image (Max 500KB)</p>
                    )}
                    <input id="prog-img" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>

                <label className={styles.label}>Short Description (Card View)</label>
                <textarea className={styles.textarea} rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

                <label className={styles.label}>Full Description (Detail Page)</label>
                <textarea className={styles.textarea} rows={5} value={formData.fullDescription || ""} onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label className={styles.label}>Objectives (One per line)</label>
                        <textarea className={styles.textarea} rows={4} value={objText} onChange={(e) => setObjText(e.target.value)} placeholder="Objective 1&#10;Objective 2" />
                    </div>
                    <div>
                        <label className={styles.label}>Activities (One per line)</label>
                        <textarea className={styles.textarea} rows={4} value={actText} onChange={(e) => setActText(e.target.value)} placeholder="Activity 1&#10;Activity 2" />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSave} className={styles.saveBtn} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
                </div>
            </div>
        </div>
    );
}
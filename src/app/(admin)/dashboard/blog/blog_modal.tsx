"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./blog_modal.module.css";
import { Blog } from "@/types/blogs";
import { saveBlog, updateBlog } from "@/lib/api/blogs";
import TipTapEditor from "./TipTapEditor";
import { mutate } from "swr";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface BlogModalProps {
    isOpen: boolean;
    onClose: () => void;
    blog: Blog;
    isAdd: boolean;
}

export default function BlogModal({ isOpen, onClose, blog, isAdd }: BlogModalProps) {
    const [formData, setFormData] = useState<Blog>(blog);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(blog);
    }, [blog]);

    if (!isOpen) return null;

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, imageUrl: data.url }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert("Title and content are required.");
            return;
        }

        setLoading(true);
        try {
            if (isAdd) {
                await saveBlog({
                    ...formData,
                    date_created: new Date().toISOString(),
                });
            } else {
                await updateBlog(formData._id!, formData);
            }

            mutate("/api/blogs");
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving blog");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>{isAdd ? "Create Blog Post" : "Edit Blog Post"}</h2>

                {/* Title */}
                <label className={styles.label}>Title</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={styles.input}
                    placeholder="Enter blog title"
                />

                {/* Image Upload */}
                <div className={styles.uploadSection}>
                    <label className={styles.label}>Featured Image</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    {formData.imageUrl ? (
                        <div className={styles.imagePreview}>
                            <Image
                                src={formData.imageUrl}
                                alt="Blog preview"
                                width={300}
                                height={200}
                                className={styles.uploadedImage}
                            />
                            <button 
                                type="button" 
                                onClick={triggerFileInput}
                                className={styles.changeImageButton}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Change Image'}
                            </button>
                        </div>
                    ) : (
                        <div 
                            className={styles.uploadArea}
                            onClick={triggerFileInput}
                        >
                            <ImageIcon className={styles.uploadIcon} />
                            <p>{uploading ? 'Uploading...' : 'Click to upload an image'}</p>
                        </div>
                    )}
                </div>

                {/* Content Editor */}
                <label className={styles.label}>Content</label>
                <TipTapEditor
                    value={formData.content}
                    onChange={(val) => setFormData({ ...formData, content: val })}
                />

                {/* Action Buttons */}
                <div className={styles.actions}>
                    <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
                    <button onClick={handleSave} className={styles.saveButton} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

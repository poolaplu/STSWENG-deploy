"use client";
import React from "react";
import Image from "next/image";
import styles from "./viewBlog.module.css";
import { Blog } from "@/types/blogs";

interface ViewBlogProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog;
}

export default function ViewBlog({ isOpen, onClose, blog }: ViewBlogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {blog.imageUrl && (
          <div className={styles.imageContainer}>
            <Image
              src={blog.imageUrl}
              alt={blog.title}
              width={800}
              height={450}
              className={styles.headerImage}
              priority
            />
          </div>
        )}

        <h1 className={styles.title}>{blog.title}</h1>

        <small className={styles.date}>
          {new Date(blog.date_created).toLocaleDateString()}
        </small>

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useMemo } from "react";
import { useDashboardData } from "@/utils/DashboardContext";
import styles from "./blog.module.css";
import BlogModal from "./blog_modal";
import ViewBlog from "./viewBlog";
import { Blog } from "@/types/blogs";
import { saveBlog, deleteBlog } from "@/lib/api/blogs";
import { mutate } from "swr";

const initialBlog: Blog = {
  title: "",
  content: "",
  imageUrl: "",
  date_created: new Date().toISOString(),
};


const SORT_OPTIONS = [
  { value: "date_created_desc", label: "Latest Created" },
  { value: "date_created", label: "Oldest Created" },
  { value: "title", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
];

export default function BlogTab() {
  const { blogs } = useDashboardData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [editData, setEditData] = useState<Blog | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_created_desc");

  const filteredAndSortedBlogs = useMemo(() => {
    return blogs
      .filter((item) =>
        searchTerm ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) : true
      )
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "title_desc") return b.title.localeCompare(a.title);
        if (sortBy === "date_created") return +new Date(a.date_created) - +new Date(b.date_created);
        if (sortBy === "date_created_desc") return +new Date(b.date_created) - +new Date(a.date_created);
        return 0;
      });
  }, [blogs, searchTerm, sortBy]);

  function handleEdit(blog: Blog) {
    setEditData(blog);
    setIsAdd(false);
    setIsModalOpen(true);
  }

  function handleView(blog: Blog) {
    setSelectedBlog(blog);
    setIsViewModalOpen(true);
  }

async function handleDelete(blog: Blog) {
  if (confirm(`Delete blog "${blog.title}"?`)) {
    await deleteBlog(blog._id!);
    mutate("/api/blogs");
  }
}
  return (
    <div className={styles.BlogTab}>
      <div className={styles.header}>
        <h1>Blog Management</h1>
        <button
          onClick={() => {
            setIsAdd(true);
            setEditData(null);
            setIsModalOpen(true);
          }}
          className={styles.addButton}
        >
          + Add Blog
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search blog..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.sortSelect}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.cardGrid}>
        {filteredAndSortedBlogs.map((blog) => (
          <BlogCard
            key={blog._id}
            blog={blog}
            onCardClick={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {isModalOpen && (
        <BlogModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          blog={editData || initialBlog}
          isAdd={isAdd}
        />
      )}

      {isViewModalOpen && selectedBlog && (
        <ViewBlog
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          blog={selectedBlog}
        />
      )}
    </div>
  );
}

function BlogCard({
  blog,
  onCardClick,
  onEdit,
  onDelete,
}: {
  blog: Blog;
  onCardClick: (blog: Blog) => void;
  onEdit: (blog: Blog) => void;
  onDelete: (blog: Blog) => void;
}) {
  return (
    <div className={styles.blogCard} onClick={() => onCardClick(blog)}>
      {blog.imageUrl && (
        <img src={blog.imageUrl} alt={blog.title} className={styles.cardImage} />
      )}

      <div className={styles.blogCardHeader}>
        <h3 style={{ fontWeight: "700" }}>{blog.title}</h3>
      </div>

      <p>{blog.content.replace(/<[^>]+>/g, "").slice(0, 100)}...</p>
      <small style={{ fontWeight: "600" }}>{new Date(blog.date_created).toLocaleDateString()}</small>

      <div className={styles.cardActions}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(blog); }}>Edit</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(blog); }}>Delete</button>
      </div>
    </div>
  );
}


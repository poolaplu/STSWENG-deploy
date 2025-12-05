import { Blog } from "@/types/blogs";

/** Fetch all blogs */
export async function getBlogs() {
  const res = await fetch("/api/blogs", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch blogs");
  return res.json();
}

/** Fetch a single blog by ID */
export async function getBlog(id: string) {
  const res = await fetch(`/api/blogs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch blog");
  return res.json();
}

/** Create a new blog post */
export async function saveBlog(blog: Blog) {
  const res = await fetch("/api/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blog),
  });

  if (!res.ok) throw new Error("Failed to save blog");
  return res.json();
}

/** Update an existing blog post */
export async function updateBlog(id: string, blog: Blog) {
  const res = await fetch(`/api/blogs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blog),
  });

  if (!res.ok) throw new Error("Failed to update blog");
  return res.json();
}

/** Delete a blog post */
export async function deleteBlog(id: string) {
  const res = await fetch(`/api/blogs/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete blog");
  return res.json();
}

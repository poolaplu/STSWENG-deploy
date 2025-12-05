"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Blog() {
  const [blogPosts, setBlogPosts] = useState([]);

  useEffect(() => {
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((data) => setBlogPosts(data))
      .catch((err) => console.error("Failed to fetch blogs:", err));
  }, []);

  return (
    <main style={{ paddingTop: "30px" }}>
      <div className="container">
        {/* Hero Section */}
        <div className="section blog-page-section">
          <h1 className="blog-page-title">Our Stories</h1>
          <p className="blog-page-description">Real stories from our ministry.</p>
        </div>

        {/* Blog Posts */}
        <div className="section">
          <div className="blog-posts-list">
            {blogPosts.length === 0 ? (
              <p>No blog posts yet.</p>
            ) : (
              blogPosts.map((post: any, index: number) => (
                <article key={index} className="blog-post-row">
                  <div
                    className="blog-row-image"
                    style={{
                      backgroundImage: `url(${post.imageUrl || "/images/default.png"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>

                  <div className="blog-row-content">
                    <h3 className="blog-row-title">{post.title}</h3>

                    <div className="blog-row-meta">
                      <span className="blog-row-date">
                        {new Date(post.date_created).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="blog-row-excerpt">
                      {post.content.replace(/<[^>]+>/g, "").slice(0, 150)}...
                    </p>

                    <Link href={`/blog/${post._id}`}>
                      <button className="blog-row-read-more">Read Full Story</button>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

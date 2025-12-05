import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

export default async function BlogPostPage({ params }: any) {
  const { id } = params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/blogs/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch blog:", await res.text());
    return <div>Failed to load blog post.</div>;
  }

  const post = await res.json();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />

      <main
        style={{
          paddingTop: "120px",
          flex: 1,
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Image wrapper to center oversized image */}
        <div
          style={{
            width: "100%",
            overflow: "visible",
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <img
            src={post.imageUrl || "/images/default.png"}
            alt={post.title}
            style={{
              width: "200%",        // oversized image
              maxHeight: "450px",
              objectFit: "cover",
              borderRadius: "5px",
              display: "block",
            }}
          />
        </div>

        {/* Text content */}
        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <h1 className="single-blog-title" style={{ marginBottom: "10px" }}>
            {post.title}
          </h1>

          <p className="single-blog-date" style={{ marginBottom: "20px" }}>
            Created: {new Date(post.date_created).toLocaleDateString()}
          </p>

          <div
            className="single-blog-content"
            style={{
              textAlign: "left",
              lineHeight: 1.7,
              color: "var(--text-dark)",
              marginBottom: "40px",
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface ImpactProps {
  title?: string;
  description?: string;
}

export default function Impact({ title, description }: ImpactProps) {
  return (
    <main style={{ paddingTop: '30px' }}>
      <div className="container">
        {/* Hero Section */}
        <div className="section impact-page-section">
          <h1 className="impact-page-title">{title || "What We Do"}</h1>
          <p className="impact-page-description">
            {description || "Our programs focus on community building and aid."}
          </p>
        </div>
      </div>
    </main>
  );
}
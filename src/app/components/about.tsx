interface AboutProps {
  mission?: string;
  vision?: string;
  history?: string;
}

export default function About({ mission, vision, history }: AboutProps) {
    return(
        <main style={{ paddingTop: '30px' }}>
            <div className="container">
            <div className="section">
                <h1 className="section-title">About Synagogue For Jesus</h1>
                <div className="grid grid-cols-2">
                <div>
                    <h2 style={{color: 'var(--primary-maroon)', marginBottom: '1rem'}}>Our Mission</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                        {mission || "Lorem ipsum dolor sit amet consectetur adipiscing elit...."}
                    </p>
                </div>
                <div>
                    <h2 style={{color: 'var(--primary-maroon)', marginBottom: '1rem'}}>Our Vision</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                        {vision || "Lorem ipsum dolor sit amet consectetur adipiscing elit...."}
                    </p>
                </div>
                </div>
            
                <div className="section">
                <h2 style={{color: 'var(--primary-maroon)', marginBottom: '2rem', textAlign: 'center'}}>Our History</h2>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                    {history || "Lorem ipsum dolor sit amet consectetur adipiscing elit...."}
                </p>
                </div>
            </div>
            </div>
        </main>
    );
}
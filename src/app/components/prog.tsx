'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Program } from "@/types/programs"; 

export default function Prog() {
  const [expandedProgram, setExpandedProgram] = useState<number | null>(null);
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        if (res.ok) {
          const data = await res.json();
          setPrograms(data);
        }
      } catch (error) {
        console.error("Failed to load programs", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const handleLearnMore = (index: number) => {
    if (expandedProgram === index) {
      setExpandedProgram(null);
    } else {
      setExpandedProgram(index);
      setTimeout(() => {
        const element = document.getElementById(`program-${index}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <main style={{ paddingTop: '30px' }}>
      <div className="container">
        
        <div className="section">
          <h1 className="section-title">Our Programs</h1>
          <p className="hero-description" style={{ textAlign: 'center', color: 'var(--dark-gray)', marginBottom: '-5rem' }}>
            Comprehensive initiatives designed to create lasting change in communities across the Philippines
          </p>
        </div>

        <div className="section">
          {/* 3. Loading / Empty States */}
          {loading && <p className="text-center text-gray-500">Loading programs...</p>}
          
          {!loading && programs.length === 0 && (
            <p className="text-center text-gray-500">No programs found.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 4. Map through REAL programs */}
            {programs.map((program, index) => (
              <div key={program._id || index} id={`program-${index}`}>
                {expandedProgram !== index ? (
                  // COLLAPSED CARD
                  <div 
                    className="program-card"
                    style={{ '--program-bg': `url(${program.imageUrl || '/images/default.png'})` } as React.CSSProperties}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <h3 className="program-title" style={{ margin: 0, flex: 1 }}>{program.title}</h3>
                    </div>
                    
                    <p className="program-description">{program.description}</p>
                    
                    <div className="program-meta">
                      <span className="program-category">{program.category}</span>
                      <span className="program-location">{program.location}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleLearnMore(index)}
                      >
                        Learn More
                      </button>
                      <Link href="/donate" className="btn btn-secondary">Support This Program</Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    background: 'var(--warm-white)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 20px var(--shadow-medium)'
                  }}>
                    {/* Hero Section */}
                    <div 
                      style={{ 
                        background: `linear-gradient(rgba(93, 46, 46, 0.8), rgba(93, 46, 46, 0.8)), url(${program.imageUrl || '/images/default.png'}) center/cover`,
                        padding: '60px 40px',
                        color: 'white',
                        position: 'relative'
                      }}
                    >
                      <button
                        onClick={() => setExpandedProgram(null)}
                        style={{
                          position: 'absolute', top: '20px', left: '20px',
                          background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white',
                          padding: '10px 20px', borderRadius: '25px', cursor: 'pointer', fontWeight: '600'
                        }}
                      >
                        ← Back
                      </button>

                      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '700', marginTop: '30px' }}>
                        {program.title}
                      </h1>
                      <p style={{ fontSize: '1.25rem', maxWidth: '800px', opacity: 0.95 }}>
                        {program.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                          {program.category}
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                          📍 {program.location}
                        </span>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div style={{ padding: '40px' }}>
                      <div className="grid grid-cols-2" style={{ gap: '3rem' }}>
                        
                        {/* Left Column: Description & Activities */}
                        <div>
                          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-maroon)', marginBottom: '1.5rem', fontWeight: '600' }}>
                            About This Program
                          </h2>
                          <div style={{ color: 'var(--dark-gray)', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-line', marginBottom: '2rem' }}>
                            {program.fullDescription || program.description}
                          </div>

                          <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-maroon)', marginBottom: '1rem', fontWeight: '600' }}>Key Activities</h3>
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {program.activities?.map((act, idx) => (
                              <li key={idx} style={{ padding: '1rem', background: 'var(--light-gray)', borderRadius: '8px', borderLeft: '4px solid var(--primary-maroon)' }}>
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Right Column: Objectives & CTA */}
                        <div>
                          <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-maroon)', marginBottom: '1.5rem', fontWeight: '600' }}>Objectives</h3>
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {program.objectives?.map((obj, idx) => (
                              <li key={idx} style={{ padding: '1.5rem', background: 'var(--warm-white)', borderRadius: '10px', boxShadow: '0 4px 6px var(--shadow-light)', display: 'flex', gap: '1rem', alignItems: 'flex-start', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '1.5rem', color: 'var(--primary-maroon)', fontWeight: '700' }}>{idx + 1}.</span>
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>

                          <div style={{ marginTop: '2rem', padding: '2rem', background: 'var(--primary-maroon)', borderRadius: '10px', color: 'white', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Support This Program</h3>
                            <Link href="/donate" className="btn btn-secondary" style={{ display: 'inline-block' }}>Donate Now</Link>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
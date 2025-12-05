'use client';

import { useState } from 'react';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Array of background images
  const heroImages = [
    '/images/1.jpeg',
    '/images/2.jpg',
    '/images/1.jpeg',
    '/images/2.jpg',
    '/images/1.jpeg',
    '/images/2.jpg',
    '/images/1.jpeg',
    '/images/2.jpg',
    '/images/1.jpeg',
    '/images/2.jpg',
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Programs data
  const programs = [
    {
      title: "Community Empowerment",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
      category: "Education",
      location: "Manila",
      background: "/images/1.jpeg"
    },
    {
      title: "Community Empowerment",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
      category: "Education",
      location: "Manila",
      background: "/images/1.jpeg"
    },
    {
      title: "Community Empowerment",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
      category: "Education",
      location: "Manila",
      background: "/images/1.jpeg"
    },
    {
      title: "Community Empowerment",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
      category: "Education",
      location: "Manila",
      background: "/images/1.jpeg"
    }
  ];

  // Projects data
  const projects = [
    {
      title: "Community Livelihood Program",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.",
      amountRaised: 750000,
      targetAmount: 1500000,
      category: "Healthcare",
      progress: 50
    },
    {
      title: "Community Livelihood Program",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.",
      amountRaised: 500000,
      targetAmount: 1000000,
      category: "Education",
      progress: 50
    },
    {
      title: "Community Livelihood Program",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.",
      amountRaised: 300000,
      targetAmount: 800000,
      category: "Livelihood",
      progress: 38
    },
    {
      title: "Community Livelihood Program",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.",
      amountRaised: 900000,
      targetAmount: 2000000,
      category: "Emergency",
      progress: 45
    },
    {
      title: "Community Livelihood Program",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.",
      amountRaised: 300000,
      targetAmount: 800000,
      category: "Livelihood",
      progress: 38
    },
    {
      title: "Community Livelihood Program",
      description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sit amet consectetur adipiscing elit quisque faucibus ex. Adipiscing elit quisque faucibus ex sapien vitae pellentesque.",
      amountRaised: 300000,
      targetAmount: 800000,
      category: "Livelihood",
      progress: 38
    }
  ];

  return (
    <main>
      {/* HERO SECTION */}
      <section id="home" className="hero">
        {/* Background with current slide */}
        <div 
          className="hero-bg"
          style={{
            backgroundImage: `linear-gradient(rgba(93, 46, 46, 0.4), rgba(74, 36, 36, 0.5)), url(${heroImages[currentSlide]})`
          }}
        ></div>
        
        {/* Navigation Buttons */}
        <button 
          className="carousel-btn carousel-btn-prev"
          onClick={prevSlide}
          aria-label="Previous image"
        >
          ‹
        </button>
        
        <button 
          className="carousel-btn carousel-btn-next"
          onClick={nextSlide}
          aria-label="Next image"
        >
          ›
        </button>

        {/* Slide Indicators */}
        <div className="slide-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Synagogue For Jesus</h1>
            <p className="hero-description">
              Lorem ipsum dolor sit amet consectetur adipiscing elit. Consectetur 
              adipiscing elit quisque faucibus ex sapien vitae. Ex sapien vitae 
              pellentesque sem placerat in id. Placerat in id cursus mi pretium tellus duis. 
              Pretium tellus duis convallis tempus leo eu aenean.
            </p>
            <div className="hero-actions">
              <a href="/donate" className="btn btn-primary">Support Our Programs</a>
              <a href="/about" className="btn btn-secondary">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS SECTION */}
      <section id="programs" className="section programs-section">
        <div className="container">
          <h2 className="main-title">will replace this with smtn else</h2>
          <div className="grid grid-cols-2">
            {programs.map((program, index) => (
              <div 
                key={index} 
                className="program-card"
                style={{ '--program-bg': `url(${program.background})` } as React.CSSProperties}
              >
                <h3 className="program-title">{program.title}</h3>
                <p className="program-description">{program.description}</p>
                <div className="program-meta">
                  <span className="program-category">{program.category}</span>
                  <span className="program-location">{program.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DONATION SECTION */}
      <section id="donate" className="section donation-section">
        <div className="container">
          <h2 className="main-title">DONATE TO OUR PROJECTS</h2>
          
          <div className="donation-filters">
            <div className="filter-group">
              <button className="filter-btn active">All Projects</button>
              <button className="filter-btn">Healthcare</button>
              <button className="filter-btn">Education</button>
              <button className="filter-btn">Livelihood</button>
              <button className="filter-btn">Emergency</button>
            </div>
          </div>

          <div className="grid grid-cols-2">
            {projects.map((project, index) => (
              <div key={index} className="project-card">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>

                <button className="btn btn-primary btn-block">Donate to this Project</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
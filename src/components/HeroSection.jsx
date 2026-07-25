import React from 'react';

const HeroSection = () => {
  return (
    <div style={{
      width: '100%',
      height: '300px',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
      backgroundImage: 'linear-gradient(to right, rgba(18, 21, 24, 0.9), rgba(18, 21, 24, 0.4)), url("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      padding: '2rem'
    }} className="animate-fade-in">
      <div style={{ maxWidth: '500px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          PLAY <span style={{ color: 'var(--secondary)' }}>AVIATOR</span> & WIN BIG!
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#e0e0e0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          Fly high with the best odds. Multiplier increases until the plane flies away. Cash out before it's too late!
        </p>
        <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
          Play Now
        </button>
      </div>
    </div>
  );
};

export default HeroSection;

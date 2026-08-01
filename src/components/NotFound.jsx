import React from 'react';

const NotFound = ({ setActiveSection }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '80px', marginBottom: '1rem', filter: 'grayscale(0.3)' }}>🏟️</div>
      <h1 style={{ fontSize: '80px', fontWeight: 900, color: 'var(--primary)', margin: 0, lineHeight: 1, textShadow: '0 0 30px rgba(134,196,57,0.4)' }}>404</h1>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Page Not Found</div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '2rem', maxWidth: '340px' }}>
        Looks like this page flew away like an Aviator crash. Let's get you back in the game.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => setActiveSection && setActiveSection('Home')}
          style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800, borderRadius: '10px', boxShadow: '0 4px 20px rgba(134,196,57,0.4)' }}
        >
          🏠 Go Home
        </button>
        <button
          className="btn"
          onClick={() => setActiveSection && setActiveSection('Aviator')}
          style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800, borderRadius: '10px', background: 'rgba(254,205,8,0.12)', border: '1px solid rgba(254,205,8,0.3)', color: '#fecd08' }}
        >
          ✈️ Play Aviator
        </button>
      </div>
    </div>
  );
};

export default NotFound;

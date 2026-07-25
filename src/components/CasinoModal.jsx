import React, { useState, useEffect } from 'react';

const CasinoModal = ({ game, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!game) return;
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 400);
          return 100;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [game]);

  if (!game) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)', padding: '1rem'
    }}>
      <div className="animate-enter" style={{
        background: '#0d1923',
        borderRadius: '16px', width: '100%', maxWidth: '1000px', height: '80vh',
        display: 'flex', flexDirection: 'column', position: 'relative',
        border: `1px solid ${game.colour}44`,
        boxShadow: `0 20px 80px rgba(0,0,0,0.8), 0 0 30px ${game.colour}33`, 
        overflow: 'hidden'
      }}>
        {/* Top bar */}
        <div style={{
          height: '50px', background: 'rgba(0,0,0,0.5)', borderBottom: `1px solid ${game.colour}33`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{game.icon}</span>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>{game.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
              {game.cat}
            </span>
          </div>
          
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', transition: 'background 0.2s'
          }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>✕</button>
        </div>

        {/* Game Area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `radial-gradient(circle at center, ${game.colour}11 0%, transparent 70%)` }}>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
              <div style={{ fontSize: '64px', marginBottom: '1rem', animation: 'pulse 1.5s infinite', filter: `drop-shadow(0 0 20px ${game.colour})` }}>
                {game.icon}
              </div>
              <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '1px' }}>
                CONNECTING TO SERVER...
              </div>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', width: `${progress}%`, 
                  background: game.colour, 
                  boxShadow: `0 0 10px ${game.colour}`,
                  transition: 'width 0.2s ease-out' 
                }} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>{progress}% Loaded</div>
            </div>
          ) : (
            <div className="animate-enter" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '100px', marginBottom: '1rem', filter: `drop-shadow(0 0 40px ${game.colour})` }}>{game.icon}</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>{game.name}</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem' }}>
                This is a simulation. In a real environment, the provider iframe for {game.name} would be embedded here.
              </p>
              
              <button 
                className="btn pulse-btn" 
                onClick={onClose}
                style={{ 
                  backgroundColor: game.colour, color: '#000', 
                  padding: '14px 40px', fontSize: '16px', fontWeight: 800, 
                  borderRadius: '30px', border: 'none', cursor: 'pointer',
                  boxShadow: `0 10px 20px ${game.colour}44`
                }}>
                Exit Game
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CasinoModal;

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const PromoModal = ({ promo, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const { wallet, user } = useUser(); // We can display user info if needed

  useEffect(() => {
    if (!promo) return;
    
    // Simulate eligibility checking and claiming
    setLoading(true);
    setSuccess(false);
    
    const timer = setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [promo]);

  if (!promo) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', padding: '1rem'
    }}>
      <div className="animate-enter" style={{
        background: 'var(--bg-panel)',
        borderRadius: '16px', width: '100%', maxWidth: '500px',
        display: 'flex', flexDirection: 'column', position: 'relative',
        border: `1px solid ${promo.colour}44`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 20px ${promo.colour}22`, 
        overflow: 'hidden'
      }}>
        {/* Header Ribbon */}
        <div style={{
          height: '6px', width: '100%', background: `linear-gradient(90deg, ${promo.colour}, transparent)`
        }} />
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff',
          width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', transition: 'background 0.2s', zIndex: 10
        }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>✕</button>

        <div style={{ padding: '2.5rem', textAlign: 'center' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '1.5rem', animation: 'spin 1.5s linear infinite', opacity: 0.5 }}>
                ⏳
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Checking Eligibility...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Please wait while we verify your account status for the {promo.title}.</p>
            </div>
          ) : success ? (
            !wallet && !user ? (
              <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '1rem', filter: `drop-shadow(0 0 15px #dc3545)` }}>
                  🔒
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#dc3545', marginBottom: '12px' }}>Authentication Required</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '2rem' }}>
                  You must be logged in to claim the <strong style={{ color: promo.colour }}>{promo.title}</strong>.<br />
                  Please register or log in to your account.
                </p>
                <button 
                  className="btn" 
                  onClick={onClose}
                  style={{ 
                    backgroundColor: '#dc3545', color: '#fff', width: '100%',
                    padding: '16px', fontSize: '16px', fontWeight: 800, 
                    borderRadius: '12px', border: 'none', cursor: 'pointer',
                  }}>
                  Close
                </button>
              </div>
            ) : (
              <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '1rem', filter: `drop-shadow(0 0 15px ${promo.colour})` }}>
                  {promo.icon}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>Congratulations!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '2rem' }}>
                  You are fully eligible for the <strong style={{ color: promo.colour }}>{promo.title}</strong>!<br />
                  {promo.sub}
                </p>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', width: '100%', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Promo Code</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '2px' }}>BETSWAL2026</div>
                </div>

                <button 
                  className="btn pulse-btn" 
                  onClick={onClose}
                  style={{ 
                    backgroundColor: promo.colour, color: '#000', width: '100%',
                    padding: '16px', fontSize: '16px', fontWeight: 800, 
                    borderRadius: '12px', border: 'none', cursor: 'pointer',
                    boxShadow: `0 8px 20px ${promo.colour}44`
                  }}>
                  Apply Bonus to Wallet
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PromoModal;

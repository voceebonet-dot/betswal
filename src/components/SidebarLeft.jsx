import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import Leaderboard from './Leaderboard';

const SidebarLeft = ({ activeSport, setActiveSport, setActiveSection }) => {
  const { user, wallet, formatCurrency } = useUser();

  const sports = [
    { name: 'Soccer', icon: '⚽' },
    { name: 'Table Tennis', icon: '🏓' },
    { name: 'Boxing', icon: '🥊' },
    { name: 'Aussie Rules', icon: '🏈' },
    { name: 'Rugby', icon: '🏉' },
    { name: 'Cricket', icon: '🏏' },
    { name: 'Baseball', icon: '⚾' },
    { name: 'Darts', icon: '🎯' },
    { name: 'MMA', icon: '🥋' },
    { name: 'Tennis', icon: '🎾' },
    { name: 'Volleyball', icon: '🏐' },
    { name: 'ESport King of Glory', icon: '🎮' },
    { name: 'Basketball', icon: '🏀' },
    { name: 'ESport Counter-Strike', icon: '🎮' },
    { name: 'eSoccer', icon: '🎮' },
    { name: 'ESport League of Legends', icon: '🎮' },
    { name: 'American Football', icon: '🏈' },
    { name: 'Beach Volley', icon: '🏖️' },
    { name: 'Zoom Soccer', icon: '📺' },
  ];

  return (
    <div className="sidebar-left-container glass-panel custom-scrollbar">
      {/* Wallet / Deposit card */}
      {user ? (
        <div style={{ backgroundColor: 'rgba(134,196,57,0.08)', border: '1px solid rgba(134,196,57,0.2)', borderRadius: '10px', padding: '10px 12px', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>💰 Wallet Balance</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#86c439', marginBottom: user.bonusBalance > 0 ? '4px' : '8px' }}>{formatCurrency(wallet)}</div>
          
          {user.bonusBalance > 0 && (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>🎁 Bonus Balance</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fecd08', marginBottom: '8px' }}>{formatCurrency(user.bonusBalance)}</div>
            </>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setActiveSection('Deposit')} className="btn btn-primary" style={{ flex: 1, padding: '6px', fontSize: '12px', fontWeight: 700 }}>+ Deposit</button>
            <button onClick={() => setActiveSection('Withdraw')} className="btn" style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }}>Withdraw</button>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: 'rgba(254,205,8,0.06)', border: '1px solid rgba(254,205,8,0.15)', borderRadius: '10px', padding: '10px 12px', marginBottom: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Join BetsWal to start winning!</div>
          <button onClick={() => setActiveSection('Register')} className="btn btn-primary pulse-btn" style={{ width: '100%', padding: '7px', fontSize: '12px', fontWeight: 700 }}>Register Free</button>
        </div>
      )}

      {/* Sport list */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
        {sports.map((sport, idx) => {
          const isActive = activeSport === sport.name;
          return (
            <li
              key={idx}
              onClick={() => setActiveSport(sport.name)}
              className="sidebar-nav-item"
              style={{
                display: 'flex', alignItems: 'center',
                gap: '0.5rem', padding: '0.5rem 0.6rem',
                borderRadius: '8px', cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(134,196,57,0.12)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive ? 600 : 400, fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{sport.icon}</span>
              {sport.name}
            </li>
          );
        })}
      </ul>

      {/* Leaderboard widget */}
      <Leaderboard />
    </div>
  );
};

export default SidebarLeft;

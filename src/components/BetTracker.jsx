import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const BetTracker = ({ onOpenMyBets }) => {
  const { myBets } = useUser();
  const [open, setOpen] = useState(false);

  const pending = myBets.filter(b => b.status === 'Pending');
  const recentSettled = myBets.filter(b => b.status !== 'Pending').slice(0, 3);

  if (myBets.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 300 }}>
      {/* Expand Panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '64px', right: 0,
          width: '300px', backgroundColor: '#17212b',
          border: '1px solid var(--border-color)', borderRadius: '14px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(134,196,57,0.12), rgba(254,205,8,0.06))' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>🎟️ Bet Tracker</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pending.length} active</span>
          </div>

          {/* Active bets */}
          {pending.length > 0 && (
            <div style={{ padding: '8px' }}>
              {pending.slice(0, 4).map((bet, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-btn)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bet.ticketRef}</span>
                    <span style={{ fontSize: '11px', backgroundColor: 'rgba(255,183,3,0.15)', color: '#ffb703', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Pending</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#fff' }}>{bet.bets.length} selection{bet.bets.length > 1 ? 's' : ''} · Odds: <strong style={{ color: 'var(--primary)' }}>{bet.totalOdds}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stake: {bet.stake}</span>
                    <span style={{ fontSize: '11px', color: '#fecd08', fontWeight: 600 }}>Win: {bet.possibleWin}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recently settled */}
          {recentSettled.length > 0 && (
            <>
              <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>Recent results</div>
              {recentSettled.map((bet, i) => {
                const colour = bet.status === 'Won' ? '#28a745' : '#dc3545';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '12px', color: '#fff' }}>{bet.ticketRef}</span>
                    <span style={{ fontSize: '11px', color: colour, fontWeight: 700, backgroundColor: `${colour}22`, padding: '2px 8px', borderRadius: '4px' }}>{bet.status}</span>
                  </div>
                );
              })}
            </>
          )}

          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={() => { onOpenMyBets?.(); setOpen(false); }} className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '12px' }}>
              View All My Bets →
            </button>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #fecd08)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(134,196,57,0.5)',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: open ? 'rotate(45deg)' : 'none',
          fontSize: '22px',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(134,196,57,0.7)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(134,196,57,0.5)'}
      >
        🎟️
      </button>

      {/* Pending count badge */}
      {pending.length > 0 && !open && (
        <div style={{
          position: 'absolute', top: '-4px', right: '-4px',
          backgroundColor: '#dc3545', color: '#fff',
          width: '20px', height: '20px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 800, border: '2px solid #0f151b',
        }}>{pending.length}</div>
      )}
    </div>
  );
};

export default BetTracker;

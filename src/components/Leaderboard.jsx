import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const Leaderboard = () => {
  const { leaderboard } = useSocket();
  const { formatCurrency } = useUser();

  const topWinners = leaderboard?.length ? leaderboard : [
    { phone: '07****23', amount: 85400, game: 'Jackpot', flag: '🇰🇪' },
    { phone: '08****17', amount: 42100, game: 'Aviator', flag: '🇳🇬' },
    { phone: '07****55', amount: 31250, game: 'Virtual Champions', flag: '🇬🇭' },
    { phone: '07****99', amount: 18700, game: 'Casino', flag: '🇿🇦' },
    { phone: '08****34', amount: 9850,  game: 'Crash', flag: '🇺🇬' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>🏆 Top Winners Today</span>
        <span style={{ fontSize: '10px', color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#28a745', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Live
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {topWinners.map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '8px',
            background: i === 0 ? 'linear-gradient(135deg, rgba(254,205,8,0.12), rgba(134,196,57,0.06))' : 'var(--bg-btn)',
            border: i === 0 ? '1px solid rgba(254,205,8,0.25)' : '1px solid transparent',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: i === 0 ? '#fecd08' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : 'var(--text-muted)', minWidth: '18px' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span style={{ fontSize: '13px' }}>{w.flag}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>{w.phone}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#28a745' }}>{formatCurrency(w.amount)}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{w.game}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

export default Leaderboard;

import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const Leaderboard = () => {
  const { leaderboard } = useSocket();
  const { formatCurrency } = useUser();

  const topWinners = leaderboard?.length ? leaderboard : [
    { phone: '07****23', amount: 85400, game: 'Jackpot',            flag: '🇰🇪' },
    { phone: '08****17', amount: 42100, game: 'Aviator',            flag: '🇳🇬' },
    { phone: '07****55', amount: 31250, game: 'Virtual Champions',  flag: '🇬🇭' },
    { phone: '07****99', amount: 18700, game: 'Casino',             flag: '🇿🇦' },
    { phone: '08****34', amount:  9850, game: 'Crash',              flag: '🇺🇬' },
  ];

  const medal = (i) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`;
  const medalColor = (i) => ['#fecd08', '#adb5bd', '#cd7f32', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'][i] ?? 'rgba(255,255,255,0.3)';

  return (
    <div style={{
      background: 'rgba(13, 22, 33, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '14px', borderRadius: '12px', marginTop: '1rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🏆 <span>Top Winners Today</span>
        </span>
        <span style={{ fontSize: '10px', color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(40,167,69,0.12)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(40,167,69,0.25)' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#28a745', display: 'inline-block', animation: 'pulse 2s infinite', boxShadow: '0 0 4px #28a745' }} />
          Live
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {topWinners.map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 10px', borderRadius: '9px',
            background: i === 0
              ? 'linear-gradient(135deg, rgba(254,205,8,0.14), rgba(134,196,57,0.07))'
              : 'rgba(255,255,255,0.04)',
            border: i === 0 ? '1px solid rgba(254,205,8,0.25)' : '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: i < 3 ? '16px' : '12px', fontWeight: 800, color: medalColor(i), minWidth: '20px', textAlign: 'center' }}>
              {medal(i)}
            </span>
            <span style={{ fontSize: '14px' }}>{w.flag}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.3px' }}>{w.phone}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>{w.game}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#86c439', textShadow: i === 0 ? '0 0 8px rgba(134,196,57,0.5)' : 'none' }}>
                {formatCurrency(w.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

export default Leaderboard;

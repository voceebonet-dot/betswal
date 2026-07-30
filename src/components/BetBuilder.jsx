import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import OddsBtn from './OddsBtn';

export const BetBuilder = ({ matchId, bets, toggleBet, setActiveSection }) => {
  const { highlights } = useSocket();
  const match = highlights.find(m => m.id === matchId) || { id: matchId, home: 'Home', away: 'Away', score: '0-0', minute: 0, status: 'upcoming', odds: [2.1, 3.2, 3.4] };
  const [activeTab, setActiveTab] = useState('Popular');

  const builderMarkets = {
    'Popular': [
      { id: '1x2', label: 'Match Result', options: [{ label: '1', odd: match.odds[0] || 2.1 }, { label: 'X', odd: match.odds[1] || 3.2 }, { label: '2', odd: match.odds[2] || 3.4 }] },
      { id: 'btts', label: 'Both Teams to Score', options: [{ label: 'Yes', odd: 1.85 }, { label: 'No', odd: 1.95 }] },
      { id: 'o25', label: 'Over/Under 2.5 Goals', options: [{ label: 'Over 2.5', odd: 1.9 }, { label: 'Under 2.5', odd: 1.9 }] }
    ],
    'Goals': [
      { id: 'o15', label: 'Over/Under 1.5 Goals', options: [{ label: 'Over 1.5', odd: 1.3 }, { label: 'Under 1.5', odd: 3.4 }] },
      { id: 'fhg', label: '1st Half Goals', options: [{ label: 'Over 0.5', odd: 1.4 }, { label: 'Under 0.5', odd: 2.8 }] }
    ],
    'Players': [
      { id: 'gs1', label: 'Anytime Goalscorer', options: [{ label: 'Player A', odd: 2.5 }, { label: 'Player B', odd: 3.1 }, { label: 'Player C', odd: 4.5 }] }
    ],
    'Corners': [
      { id: 'cor', label: 'Total Corners', options: [{ label: 'Over 9.5', odd: 1.8 }, { label: 'Under 9.5', odd: 2.0 }] }
    ]
  };

  const currentMarkets = builderMarkets[activeTab] || [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn" onClick={() => setActiveSection('Home')} style={{ padding: '8px 12px', fontSize: '14px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>← Back</button>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#fff', margin: 0 }}>⚡ Match Builder</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{match.home} vs {match.away}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '8px' }}>
        {Object.keys(builderMarkets).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 700,
              padding: '6px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Markets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {currentMarkets.map(market => (
          <div key={market.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px' }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{market.label}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {market.options.map((opt, i) => {
                const betType = `BB: ${market.label} - ${opt.label}`;
                const isActive = bets.some(b => b.matchId === match.id && b.type === betType);
                return (
                  <button
                    key={i}
                    onClick={() => toggleBet(match, betType, opt.odd)}
                    className="odds-btn pulse-btn"
                    style={{
                      flex: 1, minWidth: '100px',
                      backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-btn)',
                      color: isActive ? '#000' : '#fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '10px'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: isActive ? 'rgba(0,0,0,0.7)' : 'var(--text-muted)', marginBottom: '4px' }}>{opt.label}</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>{opt.odd.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

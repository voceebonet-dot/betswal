import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import OddsBtn from './OddsBtn';

export const BetBuilder = ({ matchId, bets, toggleBet, setActiveSection }) => {
  const { highlights } = useSocket();
  const match = highlights.find(m => m.id === matchId) || { id: matchId, home: 'Home', away: 'Away', score: '0-0', minute: 0, status: 'upcoming', odds: [2.1, 3.2, 3.4] };
  const [activeTab, setActiveTab] = useState('Popular');

  const builderMarkets = {
    'Popular': [
      { id: '1x2', label: 'Match Result (1X2)', options: [{ label: '1 (Home)', odd: match.odds[0] || 2.1 }, { label: 'X (Draw)', odd: match.odds[1] || 3.2 }, { label: '2 (Away)', odd: match.odds[2] || 3.4 }] },
      { id: 'dc', label: 'Double Chance', options: [{ label: '1X', odd: 1.25 }, { label: 'X2', odd: 1.55 }, { label: '12', odd: 1.35 }] },
      { id: 'btts', label: 'Both Teams to Score (GG/NG)', options: [{ label: 'GG (Yes)', odd: 1.85 }, { label: 'NG (No)', odd: 1.95 }] },
      { id: 'ou25', label: 'Over / Under 2.5 Goals', options: [{ label: 'Over 2.5', odd: 1.9 }, { label: 'Under 2.5', odd: 1.9 }] },
    ],
    'Goals': [
      { id: 'ou05', label: 'Over / Under 0.5 Goals', options: [{ label: 'Over 0.5', odd: 1.08 }, { label: 'Under 0.5', odd: 8.0 }] },
      { id: 'ou15', label: 'Over / Under 1.5 Goals', options: [{ label: 'Over 1.5', odd: 1.3 }, { label: 'Under 1.5', odd: 3.4 }] },
      { id: 'ou25b', label: 'Over / Under 2.5 Goals', options: [{ label: 'Over 2.5', odd: 1.9 }, { label: 'Under 2.5', odd: 1.9 }] },
      { id: 'ou35', label: 'Over / Under 3.5 Goals', options: [{ label: 'Over 3.5', odd: 2.7 }, { label: 'Under 3.5', odd: 1.43 }] },
      { id: 'ou45', label: 'Over / Under 4.5 Goals', options: [{ label: 'Over 4.5', odd: 4.5 }, { label: 'Under 4.5', odd: 1.18 }] },
      { id: 'fhg', label: '1st Half Over / Under 0.5', options: [{ label: 'Over 0.5', odd: 1.4 }, { label: 'Under 0.5', odd: 2.8 }] },
      { id: 'fhg15', label: '1st Half Over / Under 1.5', options: [{ label: 'Over 1.5', odd: 2.5 }, { label: 'Under 1.5', odd: 1.5 }] },
      { id: 'bttsht', label: 'Both Teams Score - HT', options: [{ label: 'Yes', odd: 3.4 }, { label: 'No', odd: 1.3 }] },
    ],
    'HT / FT': [
      { id: 'ht1x2', label: 'Half Time Result', options: [{ label: '1', odd: 2.6 }, { label: 'X', odd: 2.1 }, { label: '2', odd: 4.0 }] },
      { id: 'htft', label: 'HT / FT (Double)', options: [
        { label: '1/1', odd: 3.5 }, { label: '1/X', odd: 9.0 }, { label: '1/2', odd: 14.0 },
        { label: 'X/1', odd: 4.5 }, { label: 'X/X', odd: 3.8 }, { label: 'X/2', odd: 6.0 },
        { label: '2/1', odd: 18.0 }, { label: '2/X', odd: 11.0 }, { label: '2/2', odd: 4.8 },
      ]},
    ],
    'Asian': [
      { id: 'ah0', label: 'Asian Handicap 0', options: [{ label: match.home, odd: 1.88 }, { label: match.away, odd: 1.88 }] },
      { id: 'ahn05', label: 'Asian Handicap -0.5', options: [{ label: `${match.home} -0.5`, odd: 2.1 }, { label: `${match.away} +0.5`, odd: 1.75 }] },
      { id: 'ahp05', label: 'Asian Handicap +0.5', options: [{ label: `${match.home} +0.5`, odd: 1.6 }, { label: `${match.away} -0.5`, odd: 2.3 }] },
    ],
    'Correct Score': [
      { id: 'cs10', label: 'Correct Score', options: [
        { label: '1-0', odd: 6.5 }, { label: '2-0', odd: 8.0 }, { label: '2-1', odd: 7.5 },
        { label: '0-0', odd: 8.5 }, { label: '1-1', odd: 5.8 }, { label: '2-2', odd: 12.0 },
        { label: '0-1', odd: 8.0 }, { label: '0-2', odd: 10.0 }, { label: '1-2', odd: 9.0 },
        { label: '3-0', odd: 14.0 }, { label: '3-1', odd: 13.0 }, { label: '3-2', odd: 16.0 },
      ]},
    ],
    'Cards': [
      { id: 'tcu35', label: 'Total Cards Over/Under 3.5', options: [{ label: 'Over 3.5', odd: 1.8 }, { label: 'Under 3.5', odd: 1.95 }] },
      { id: 'tcu55', label: 'Total Cards Over/Under 5.5', options: [{ label: 'Over 5.5', odd: 2.4 }, { label: 'Under 5.5', odd: 1.55 }] },
      { id: 'hrc', label: 'Home Team Red Card', options: [{ label: 'Yes', odd: 5.5 }, { label: 'No', odd: 1.15 }] },
      { id: 'arc', label: 'Away Team Red Card', options: [{ label: 'Yes', odd: 6.0 }, { label: 'No', odd: 1.13 }] },
    ],
    'Clean Sheet': [
      { id: 'hcs', label: 'Home Clean Sheet', options: [{ label: 'Yes', odd: 2.4 }, { label: 'No', odd: 1.55 }] },
      { id: 'acs', label: 'Away Clean Sheet', options: [{ label: 'Yes', odd: 2.9 }, { label: 'No', odd: 1.38 }] },
    ],
    'Corners': [
      { id: 'cor85', label: 'Total Corners Over/Under 8.5', options: [{ label: 'Over 8.5', odd: 1.88 }, { label: 'Under 8.5', odd: 1.88 }] },
      { id: 'cor95', label: 'Total Corners Over/Under 9.5', options: [{ label: 'Over 9.5', odd: 2.1 }, { label: 'Under 9.5', odd: 1.72 }] },
      { id: 'fhcor', label: '1st Half Corners Over/Under 4.5', options: [{ label: 'Over 4.5', odd: 2.0 }, { label: 'Under 4.5', odd: 1.8 }] },
    ],
  };


  const currentMarkets = builderMarkets[activeTab] || [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn" onClick={() => setActiveSection('Home')} style={{ padding: '8px 12px', fontSize: '14px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>← Back</button>
        <div>
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

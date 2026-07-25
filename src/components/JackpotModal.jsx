import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';
import OddsBtn from './OddsBtn';

const generateMockGames = (count) => {
  const teams = [
    'Arsenal', 'Chelsea', 'Man City', 'Man Utd', 'Liverpool', 'Spurs', 'Everton', 'Aston Villa',
    'Real Madrid', 'Barcelona', 'Atletico', 'Sevilla', 'Valencia', 'Villarreal',
    'Juventus', 'Milan', 'Inter', 'Roma', 'Napoli', 'Lazio',
    'Bayern', 'Dortmund', 'Leipzig', 'Leverkusen', 'PSG', 'Marseille', 'Lyon'
  ];
  
  const games = [];
  for (let i = 1; i <= count; i++) {
    const home = teams[Math.floor(Math.random() * teams.length)];
    let away = teams[Math.floor(Math.random() * teams.length)];
    while (away === home) away = teams[Math.floor(Math.random() * teams.length)];
    
    games.push({
      id: `jp-game-${i}`,
      num: i,
      home,
      away,
      odds: [
        (Math.random() * 1.5 + 1.2).toFixed(2),
        (Math.random() * 1.5 + 2.5).toFixed(2),
        (Math.random() * 2 + 1.5).toFixed(2)
      ],
      date: `Tomorrow, 19:${Math.random() > 0.5 ? '00' : '30'}`
    });
  }
  return games;
};

const JackpotModal = ({ jackpotKey, onClose }) => {
  const { jackpot } = useSocket();
  const { formatCurrency } = useUser();
  const [games, setGames] = useState([]);
  const [selections, setSelections] = useState({}); // gameId -> '1', 'X', or '2'
  
  const defaultJackpots = {
    mega: { name: 'Mega Jackpot', games: 17, minStake: 100, currency: 'KES', amount: 345000000, color: '#fecd08' },
    midi: { name: 'Midi Jackpot', games: 15, minStake: 50, currency: 'KES', amount: 15000000, color: '#3498db' },
    mini: { name: 'Mini Jackpot', games: 13, minStake: 20, currency: 'KES', amount: 2500000, color: '#e74c3c' },
    liga: { name: 'Ligi Bigi', games: 15, minStake: 49, currency: 'KES', amount: 5000000, color: '#fecd08' }
  };

  const currentJackpot = jackpot?.[jackpotKey] || defaultJackpots[jackpotKey];

  useEffect(() => {
    if (currentJackpot) {
      setGames(generateMockGames(currentJackpot.games));
      setSelections({});
    }
  }, [currentJackpot]);

  if (!currentJackpot) return null;

  const handleSelect = (gameId, type) => {
    setSelections(prev => {
      const next = { ...prev };
      if (next[gameId] === type) {
        delete next[gameId]; // Deselect
      } else {
        next[gameId] = type;
      }
      return next;
    });
  };

  const allSelected = Object.keys(selections).length === currentJackpot.games;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', padding: '1rem'
    }}>
      <div className="animate-enter" style={{
        background: 'var(--bg-panel)',
        borderRadius: '16px', width: '100%', maxWidth: '800px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        border: `1px solid ${currentJackpot.color || 'var(--primary)'}44`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0))`
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: currentJackpot.color || '#fff' }}>
              {currentJackpot.name}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Select {currentJackpot.games} matches to win <span style={{ color: '#fff', fontWeight: 700 }}>{formatCurrency(currentJackpot.amount)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>✕</button>
        </div>

        {/* Matches List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {games.map(g => {
            const isSelected = !!selections[g.id];
            return (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '12px', marginBottom: '12px',
                background: isSelected ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${isSelected ? (currentJackpot.color || 'var(--primary)') : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '8px', transition: 'all 0.2s'
              }}>
                <div style={{ 
                  width: '30px', height: '30px', borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.1)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)'
                }}>{g.num}</div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                    {g.home} <span style={{ color: 'var(--text-muted)', margin: '0 8px', fontWeight: 400 }}>vs</span> {g.away}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{g.date}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['1', 'X', '2'].map((type, idx) => (
                    <OddsBtn 
                      key={type}
                      label={type}
                      odd={g.odds[idx]}
                      selected={selections[g.id] === type}
                      onClick={() => handleSelect(g.id, type)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.3)', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Selections</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: allSelected ? '#28a745' : '#fff' }}>
              {Object.keys(selections).length} / {currentJackpot.games}
            </div>
          </div>
          
          <button 
            className="btn pulse-btn"
            disabled={!allSelected}
            style={{ 
              padding: '14px 32px', fontSize: '16px', fontWeight: 800, borderRadius: '8px',
              backgroundColor: allSelected ? (currentJackpot.color || 'var(--primary)') : 'var(--bg-btn)',
              color: allSelected ? '#000' : 'var(--text-muted)',
              cursor: allSelected ? 'pointer' : 'not-allowed',
              border: 'none'
            }}
            onClick={() => {
              alert(`Successfully submitted your ${currentJackpot.name} slip!`);
              onClose();
            }}
          >
            {allSelected ? `Place ${currentJackpot.name} Stake` : 'Select all matches'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JackpotModal;

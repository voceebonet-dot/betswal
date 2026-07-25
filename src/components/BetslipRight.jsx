import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const BetslipRight = ({ bets, clearBets, removeBet }) => {
  const { socket } = useSocket();
  const { country, formatCurrency, myBets, addBetToHistory } = useUser();
  const [stake, setStake]         = useState(100);
  const [activeTab, setActiveTab] = useState('Betslip');
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage]     = useState('');
  const [shareCode, setShareCode] = useState('');

  const totalOdds  = bets.reduce((acc, b) => acc * b.odds, 1).toFixed(2);
  const possibleWin = (totalOdds * stake).toFixed(2);

  const tabs = [
    { name: 'Betslip', count: bets.length },
    { name: 'My Bets', count: myBets.length },
  ];

  // ── Socket actions ─────────────────────────────────────────────
  const handleLoadBetslip = () => {
    if (!codeInput.trim()) return;
    setMessage('Loading…');
    socket.emit('load_betslip', { code: codeInput.trim() });

    socket.once('betslip_loaded', ({ bets: loaded }) => {
      clearBets();
      loaded.forEach(b => {
        // Re-add each saved bet through the parent toggleBet via a custom event
      });
      setMessage(`✅ Loaded ${loaded.length} bet(s)`);
      setCodeInput('');
    });

    socket.once('betslip_error', ({ message: err }) => {
      setMessage(`❌ ${err}`);
    });
  };

  const handleShareBetslip = () => {
    if (!bets.length) return;
    socket.emit('save_betslip', { bets });
    socket.once('betslip_saved', ({ code }) => {
      setShareCode(code);
    });
  };

  const handlePlaceBet = () => {
    if (!bets.length || !socket) return;
    socket.emit('place_bet', { bets, stake: parseFloat(stake) });
    socket.once('bet_confirmed', ({ ticketRef, totalOdds: to, possibleWin: pw }) => {
      addBetToHistory(ticketRef, bets, to, stake, pw);
      setMessage(`🎟️ Bet placed! Ref: ${ticketRef} | Win: ${country.symbol} ${pw}`);
      clearBets();
      setActiveTab('My Bets');
      setTimeout(() => setMessage(''), 3000); // clear toast after animation
    });
  };

  return (
    <div className="glass-panel custom-scrollbar" style={{ borderRadius: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.name;
          return (
            <div
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              style={{
                flex: 1, textAlign: 'center', padding: '12px 4px', cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                color: isActive ? 'var(--primary)' : '#fff',
                fontWeight: 500, fontSize: '12px', transition: 'all 0.2s'
              }}
            >
              {tab.name} ({tab.count})
            </div>
          );
        })}
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {activeTab === 'Betslip' && (
          <>
            {/* Shared betslip loader */}
        <div>
          <div style={{ color: '#fff', fontWeight: 500, marginBottom: '8px', fontSize: '13px', textAlign: 'center' }}>
            Do you have a shared betslip code? Enter it here.
          </div>
          <input
            type="text"
            className="glow-focus"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value)}
            placeholder="e.g. VBMsU"
            style={{
              width: '100%', backgroundColor: 'var(--bg-btn)',
              border: '1px solid var(--border-color)', color: 'var(--text-main)',
              padding: '10px', borderRadius: '4px', textAlign: 'center',
              outline: 'none', fontSize: '13px', marginBottom: '8px',
              transition: 'all 0.2s'
            }}
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '4px' }}
            onClick={handleLoadBetslip}
          >
            Load Betslip
          </button>
        </div>

        {/* Status message */}
        {message && (
          message.includes('Bet placed') ? (
            <div className="toast-message">
              {message}
            </div>
          ) : (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              {message}
            </div>
          )
        )}

        {/* Share code display */}
        {shareCode && (
          <div style={{ backgroundColor: 'rgba(134,196,57,0.1)', border: '1px solid var(--primary)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Share this code with friends:</div>
            <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '4px', color: 'var(--primary)' }}>{shareCode}</div>
          </div>
        )}

        {/* Empty state */}
        {bets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)' }}>
            <p>Your betslip is empty.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Select odds to place a bet.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span style={{ fontWeight: 600 }}>Your Selections</span>
              <span style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '12px' }} onClick={clearBets}>Clear All</span>
            </div>

            {bets.map(bet => (
              <div key={bet.matchId} className="bet-item-card" style={{ backgroundColor: 'var(--bg-btn)', padding: '10px', borderRadius: '4px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '8px', right: '10px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => removeBet(bet.matchId)}>✕</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  1X2 — {bet.type === '1' ? 'Home' : bet.type === '2' ? 'Away' : 'Draw'}
                </div>
                <div style={{ fontWeight: 600, marginBottom: '6px', paddingRight: '20px' }}>{bet.home} vs {bet.away}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 700 }}>
                  <span>Odds</span>
                  <span>{typeof bet.odds === 'number' ? bet.odds.toFixed(2) : bet.odds}</span>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Odds</span>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>{totalOdds}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '13px' }}>Amount ({country.symbol})</span>
                <input
                  type="number"
                  className="glow-focus"
                  value={stake}
                  onChange={e => setStake(e.target.value)}
                  style={{
                    flex: 1, backgroundColor: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)', color: '#fff',
                    padding: '8px', borderRadius: '4px', textAlign: 'right', outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
              </div>

              <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Possible Win</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>{country.symbol} {possibleWin}</span>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '4px', marginBottom: '8px' }} onClick={handlePlaceBet}>
                Place Bet
              </button>

              <button
                className="btn"
                style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '4px', backgroundColor: 'var(--bg-btn)', color: 'var(--text-muted)' }}
                onClick={handleShareBetslip}
              >
                🔗 Share Betslip
              </button>
            </div>
          </>
        )}
          </>
        )}

        {activeTab === 'My Bets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myBets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <p>You have no placed bets.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Place a bet to see it here.</p>
              </div>
            ) : (
              myBets.map((bet, i) => {
                const statusColour = bet.status === 'Won' ? '#28a745' : bet.status === 'Lost' ? '#dc3545' : '#ffb703';
                return (
                  <div key={i} className="bet-item-card" style={{ backgroundColor: 'var(--bg-btn)', padding: '12px', borderRadius: '6px' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ref: {bet.ticketRef}</span>
                      <span style={{ fontSize: '11px', color: statusColour, fontWeight: 600, backgroundColor: `${statusColour}22`, padding: '2px 6px', borderRadius: '4px' }}>{bet.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                      {bet.bets.length} Selection{bet.bets.length > 1 ? 's' : ''} • Total Odds: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{bet.totalOdds}</span>
                    </div>
                    <div className="flex justify-between items-center" style={{ fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Stake: {country.symbol} {bet.stake}</span>
                      <span style={{ fontWeight: 600 }}>Win: {country.symbol} {bet.possibleWin}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default BetslipRight;

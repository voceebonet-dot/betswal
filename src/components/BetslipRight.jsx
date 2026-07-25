import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const BetslipRight = ({ bets, clearBets, removeBet }) => {
  const { socket } = useSocket();
  const { country, formatCurrency, myBets, addBetToHistory, user, deductStake, wallet } = useUser();
  const [stake, setStake]         = useState(100);
  const [activeTab, setActiveTab] = useState('Betslip');
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage]     = useState('');
  const [shareCode, setShareCode] = useState('');
  const [msgType, setMsgType]     = useState('info'); // 'success' | 'error' | 'info'

  const totalOdds   = bets.reduce((acc, b) => acc * b.odds, 1).toFixed(2);
  const possibleWin = (totalOdds * stake).toFixed(2);

  const quickStakes = [50, 100, 200, 500];

  const flash = (text, type = 'info') => {
    setMessage(text); setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const tabs = [
    { name: 'Betslip', count: bets.length },
    { name: 'My Bets', count: myBets.length },
  ];

  const handleLoadBetslip = () => {
    if (!codeInput.trim()) return;
    flash('Loading…', 'info');
    socket.emit('load_betslip', { code: codeInput.trim() });
    socket.once('betslip_loaded', ({ bets: loaded }) => {
      flash(`✅ Loaded ${loaded.length} bet(s)`, 'success');
      setCodeInput('');
    });
    socket.once('betslip_error', ({ message: err }) => flash(`❌ ${err}`, 'error'));
  };

  const handleShareBetslip = () => {
    if (!bets.length) return;
    socket.emit('save_betslip', { bets });
    socket.once('betslip_saved', ({ code }) => setShareCode(code));
  };

  const handlePlaceBet = () => {
    if (!user) { flash('⚠️ Please login to place a bet.', 'error'); return; }
    if (!bets.length || !socket) return;
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) { flash('❌ Enter a valid stake.', 'error'); return; }
    if (stakeNum > wallet) { flash(`❌ Insufficient balance. Wallet: ${country.symbol} ${wallet}`, 'error'); return; }
    const res = deductStake(stakeNum);
    if (!res.ok) { flash(`❌ ${res.error}`, 'error'); return; }
    socket.emit('place_bet', { bets, stake: stakeNum });
    socket.once('bet_confirmed', ({ ticketRef, totalOdds: to, possibleWin: pw }) => {
      addBetToHistory(ticketRef, bets, to, stake, pw);
      flash(`🏟️ Bet placed! Ref: ${ticketRef} | Win: ${country.symbol} ${pw}`, 'success');
      clearBets();
      setActiveTab('My Bets');
    });
  };

  const msgColor = msgType === 'success' ? '#86c439' : msgType === 'error' ? '#dc3545' : '#fecd08';

  return (
    <div style={{
      background: 'rgba(13, 22, 33, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 100px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(134,196,57,0.08), rgba(254,205,8,0.04))' }}>
        <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff', letterSpacing: '0.3px', marginBottom: '2px' }}>🎯 Bet Slip</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{bets.length} selection{bets.length !== 1 ? 's' : ''} added</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.name;
          return (
            <div key={tab.name} onClick={() => setActiveTab(tab.name)} style={{
              flex: 1, textAlign: 'center', padding: '11px 4px', cursor: 'pointer',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.35)',
              fontWeight: isActive ? 700 : 400, fontSize: '12px', transition: 'all 0.2s',
              background: isActive ? 'rgba(134,196,57,0.04)' : 'transparent',
            }}>
              {tab.name}
              <span style={{ marginLeft: '5px', background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.08)', color: isActive ? '#000' : 'rgba(255,255,255,0.4)', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                {tab.count}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {activeTab === 'Betslip' && (
          <>
            {/* Load betslip */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                Load Shared Betslip
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="glow-focus"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder="Enter code e.g. VBMsU"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
                    padding: '8px 10px', borderRadius: '7px', fontSize: '13px',
                    outline: 'none', transition: 'all 0.2s',
                  }}
                />
                <button className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '7px', whiteSpace: 'nowrap' }} onClick={handleLoadBetslip}>
                  Load
                </button>
              </div>
            </div>

            {/* Status message */}
            {message && (
              <div style={{ background: msgColor + '18', border: `1px solid ${msgColor}44`, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: msgColor, textAlign: 'center', fontWeight: 600 }}>
                {message}
              </div>
            )}

            {/* Share code */}
            {shareCode && (
              <div style={{ background: 'rgba(134,196,57,0.08)', border: '1px solid rgba(134,196,57,0.3)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', letterSpacing: '0.5px' }}>Unique Booking Code</div>
                <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '6px', color: 'var(--primary)', textShadow: '0 0 12px rgba(134,196,57,0.4)', marginBottom: '8px' }}>{shareCode}</div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px', fontWeight: 700 }}
                  onClick={() => {
                    navigator.clipboard.writeText(shareCode);
                    flash(`📋 Code ${shareCode} copied!`, 'success');
                  }}
                >
                  📋 Copy Code
                </button>
              </div>
            )}

            {/* Empty state */}
            {bets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Your betslip is empty</div>
                <div style={{ fontSize: '12px' }}>Click any odds button to add a selection</div>
              </div>
            ) : (
              <>
                {/* Selections header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Your Selections</span>
                  <span style={{ color: '#dc3545', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', transition: 'all 0.2s' }} onClick={clearBets}>✕ Clear</span>
                </div>

                {/* Bet items */}
                {bets.map(bet => (
                  <div key={bet.matchId} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '10px', position: 'relative', transition: 'all 0.2s' }}>
                    <button onClick={() => removeBet(bet.matchId)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(220,53,69,0.12)', border: 'none', color: '#dc3545', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, transition: 'all 0.2s' }}>✕</button>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      1X2 — {bet.type === '1' ? 'Home Win' : bet.type === '2' ? 'Away Win' : 'Draw'}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '8px', paddingRight: '24px', color: '#fff', fontSize: '13px' }}>{bet.home} vs {bet.away}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Odds</span>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: '#fecd08', textShadow: '0 0 8px rgba(254,205,8,0.4)' }}>
                        {typeof bet.odds === 'number' ? bet.odds.toFixed(2) : bet.odds}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Quick stake presets */}
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Quick Stake ({country.symbol})</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {quickStakes.map(v => (
                      <button key={v} onClick={() => setStake(v)} style={{ flex: 1, padding: '6px 4px', background: stake == v ? 'rgba(134,196,57,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${stake == v ? 'rgba(134,196,57,0.4)' : 'rgba(255,255,255,0.07)'}`, color: stake == v ? '#86c439' : 'rgba(255,255,255,0.5)', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, transition: 'all 0.2s' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stake input */}
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 700 }}>{country.symbol}</span>
                  <input
                    type="number"
                    className="glow-focus"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '11px 12px 11px 36px', borderRadius: '9px', fontSize: '16px', fontWeight: 800, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                  />
                </div>

                {/* Totals */}
                <div style={{ background: 'rgba(134,196,57,0.05)', border: '1px solid rgba(134,196,57,0.12)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Total Odds</span>
                    <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff' }}>{totalOdds}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Possible Win</span>
                    <span style={{ fontWeight: 900, fontSize: '20px', color: '#86c439', textShadow: '0 0 12px rgba(134,196,57,0.5)' }}>{country.symbol} {possibleWin}</span>
                  </div>
                </div>

                {/* CTA buttons */}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '10px', fontWeight: 800, boxShadow: '0 4px 20px rgba(134,196,57,0.35)', letterSpacing: '0.3px' }}
                  onClick={handlePlaceBet}
                >
                  Place Bet →
                </button>
                <button
                  className="btn"
                  style={{ width: '100%', padding: '10px', fontSize: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={handleShareBetslip}
                  onMouseEnter={e => e.currentTarget.style.color = '#86c439'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  🔗 Share Betslip
                </button>
              </>
            )}
          </>
        )}

        {activeTab === 'My Bets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myBets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎟️</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>No bets placed yet</div>
                <div style={{ fontSize: '12px' }}>Place a bet to see it here</div>
              </div>
            ) : (
              myBets.map((bet, i) => {
                const statusColor = bet.status === 'Won' ? '#86c439' : bet.status === 'Lost' ? '#dc3545' : '#fecd08';
                const statusIcon  = bet.status === 'Won' ? '✅' : bet.status === 'Lost' ? '❌' : '⏳';
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '10px', borderLeft: `3px solid ${statusColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>#{bet.ticketRef}</span>
                      <span style={{ fontSize: '11px', color: statusColor, fontWeight: 700, background: `${statusColor}22`, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${statusColor}44` }}>
                        {statusIcon} {bet.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                      {bet.bets.length} selection{bet.bets.length > 1 ? 's' : ''} · Odds: <span style={{ color: '#fecd08', fontWeight: 700 }}>{bet.totalOdds}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Stake: {country.symbol} {bet.stake}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#86c439' }}>Win: {country.symbol} {bet.possibleWin}</span>
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

import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import AviatorGame from './AviatorGame';
import {
  CasinoPage, VirtualsPage, CrashGamesPage, LigiBigiPage,
  ShikishaPage, BetsWalFastaPage, PromotionsPage, LiveScorePage,
  AppPage, AuthPage, DepositPage, WithdrawPage, AccountPage, ResponsiblePage,
  ProfilePage,
} from './Pages';
import AdminDashboard from './AdminDashboard';
import { BetBuilder } from './BetBuilder';

import OddsBtn from './OddsBtn';

// ── Live panel (WebSocket odds + scores) ─────────────────────────────────────
const LivePanel = ({ bets, toggleBet }) => {
  const { liveMatches, connected } = useSocket();
  const prevRef = useRef({});
  const [prevOdds, setPrevOdds] = useState({});

  useEffect(() => {
    const newPrev = {};
    liveMatches.forEach(m => { newPrev[m.id] = prevRef.current[m.id]; });
    setPrevOdds(newPrev);
    liveMatches.forEach(m => { prevRef.current[m.id] = m.odds; });
  }, [liveMatches]);

  if (!connected) return (
    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>🔴</div>
      Connecting to live server…
    </div>
  );

  const betTypes = ['1', 'X', '2'];

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem',
        padding: '8px 12px', backgroundColor: 'rgba(211,47,47,0.1)',
        borderRadius: '4px', border: '1px solid rgba(211,47,47,0.3)'
      }}>
        <span style={{ width: '10px', height: '10px', backgroundColor: '#d32f2f', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span style={{ fontWeight: 700, color: '#d32f2f' }}>LIVE GAMES</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>— Odds update every 3 s in real-time</span>
      </div>

      {liveMatches.map(match => (
        <div key={match.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 0', borderBottom: '1px solid var(--border-color)',
          opacity: match.status === 'finished' ? 0.5 : 1
        }}>
          {/* Team Info */}
          <div style={{ flex: 1, paddingRight: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>⚽ {match.country}</div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{match.home}</div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{match.away}</div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', padding: '0 1rem', minWidth: '90px' }}>
            {match.status === 'finished' ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>FT</div>
            ) : (
              <div style={{ backgroundColor: '#d32f2f', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '3px', padding: '2px 6px', marginBottom: '6px', display: 'inline-block', animation: 'pulse 2s infinite' }}>
                LIVE {match.minute}'
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: '20px', color: '#fff', letterSpacing: '2px' }}>{match.score}</div>
          </div>

          {/* Odds */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {match.odds.map((odd, idx) => {
              const type = betTypes[idx];
              const prev = prevOdds[match.id]?.[idx];
              return (
                <OddsBtn
                  key={idx}
                  odd={odd}
                  prevOdd={prev}
                  selected={bets.some(b => b.matchId === match.id && b.type === type)}
                  label={type}
                  onClick={() => toggleBet(match, type, odd)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Highlights panel (gentle pre-match odds drift) ────────────────────────────
const HighlightsPanel = ({ activeSport, bets, toggleBet }) => {
  const { highlights } = useSocket();
  const prevRef = useRef({});
  const [prevOdds, setPrevOdds] = useState({});

  useEffect(() => {
    const newPrev = {};
    highlights.forEach(m => { newPrev[m.id] = prevRef.current[m.id]; });
    setPrevOdds(newPrev);
    highlights.forEach(m => { prevRef.current[m.id] = m.odds; });
  }, [highlights]);

  const betTypes = ['1', 'X', '2'];

  const filteredHighlights = highlights.filter(m => !activeSport || m.sport === activeSport || (activeSport === 'Soccer' && !m.sport));

  if (!filteredHighlights.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-panel)', borderRadius: '12px', marginTop: '1rem' }}>
      <div style={{ fontSize: '48px', marginBottom: '1rem', opacity: 0.5 }}>🏟️</div>
      <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '0.5rem' }}>No matches scheduled</h3>
      <p>There are currently no {activeSport} matches scheduled. Please check back later or try another sport.</p>
    </div>
  );

  const getSportIcon = (sport) => {
    switch (sport) {
      case 'Basketball': return '🏀';
      case 'Tennis': return '🎾';
      case 'Table Tennis': return '🏓';
      case 'Boxing': return '🥊';
      case 'Rugby': return '🏉';
      case 'eSoccer': return '🎮';
      default: return '⚽';
    }
  };

  return (
    <div>
      {filteredHighlights.map(match => (
        <div key={match.id} className="match-row">
          <div style={{ flex: 1, paddingRight: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>{getSportIcon(match.sport || activeSport)} {match.country}</div>
            <div style={{ fontWeight: 500, color: '#fff', marginBottom: '4px' }}>{match.home}</div>
            <div style={{ fontWeight: 500, color: '#fff' }}>{match.away}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {match.odds.map((odd, idx) => {
              const type = betTypes[idx];
              const prev = prevOdds[match.id]?.[idx];
              return (
                <OddsBtn
                  key={idx}
                  odd={odd}
                  prevOdd={prev}
                  selected={bets.some(b => b.matchId === match.id && b.type === type)}
                  label={type}
                  onClick={() => toggleBet(match, type, odd)}
                />
              );
            })}
          </div>

          <div style={{ width: '90px', textAlign: 'right', fontSize: '12px', marginLeft: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span
              onClick={() => setActiveSection(`BetBuilder_${match.id}`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                backgroundColor: 'rgba(134,196,57,0.12)',
                border: '1px solid rgba(134,196,57,0.35)',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--primary)',
                letterSpacing: '0.3px',
                transition: 'all 0.2s',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(134,196,57,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(134,196,57,0.12)'; }}
            >
              ⚡ Build
            </span>
            <div style={{ color: 'var(--text-muted)' }}>{match.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Jackpots panel ────────────────────────────────────────────────────────────
const JackpotPanel = ({ setActiveJackpot }) => {
  const { jackpot } = useSocket();
  const [prevAmounts, setPrevAmounts] = React.useState({});
  const prevRef = React.useRef({});

  React.useEffect(() => {
    if (!jackpot) return;
    const newPrev = {};
    Object.entries(jackpot).forEach(([key, j]) => { newPrev[key] = prevRef.current[key]; });
    setPrevAmounts(newPrev);
    Object.entries(jackpot).forEach(([key, j]) => { prevRef.current[key] = j.amount; });
  }, [jackpot]);

  const format = (n) => n.toLocaleString('en-KE');

  // Hardcoded placeholders for richer display if socket lacks them
  const defaultJackpots = {
    mega: { name: 'Mega Jackpot', games: 17, minStake: 100, currency: 'KES', amount: 345000000, color: '#fecd08', icon: '🏆' },
    midi: { name: 'Midi Jackpot', games: 15, minStake: 50, currency: 'KES', amount: 15000000, color: '#3498db', icon: '💰' },
    mini: { name: 'Mini Jackpot', games: 13, minStake: 20, currency: 'KES', amount: 2500000, color: '#e74c3c', icon: '🎯' }
  };

  // merge live with default
  const displayJackpots = jackpot || defaultJackpots;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '28px' }}>💰</span> Jackpots
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Predict correctly and win massive prizes</p>
      </div>
      
      {Object.entries(displayJackpots).map(([key, j], i) => {
        const grew = prevAmounts[key] != null && j.amount > prevAmounts[key];
        const color = j.color || (i === 0 ? '#fecd08' : i === 1 ? '#3498db' : '#e74c3c');
        const icon = j.icon || (i === 0 ? '🏆' : i === 1 ? '💰' : '🎯');
        
        return (
          <div key={key} className="glass-panel" style={{
            background: `linear-gradient(135deg, rgba(27,36,46,0.9), rgba(13,25,35,0.9))`,
            border: `1px solid ${color}44`, 
            borderRadius: '16px', 
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: grew ? `0 0 20px ${color}44` : 'none',
            transition: 'all 0.3s'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.05, filter: `drop-shadow(0 0 20px ${color})` }}>
              {icon}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '32px', background: `${color}22`, width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}44` }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '4px' }}>{j.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ color: color, fontWeight: 700 }}>{j.games}</span> Matches • Min Stake: {j.currency} {j.minStake}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Current Prize</div>
                <div style={{
                  fontWeight: 900, fontSize: '28px',
                  color: grew ? '#28a745' : color,
                  textShadow: `0 0 10px ${grew ? '#28a745' : color}66`,
                  transition: 'color 0.5s, text-shadow 0.5s'
                }}>
                  {j.currency} {format(j.amount)} {grew && '🔥'}
                </div>
              </div>
            </div>
            
            <button className="btn pulse-btn" style={{ 
              width: '100%', padding: '14px', fontWeight: 800, fontSize: '15px',
              backgroundColor: color, color: '#000', borderRadius: '8px',
              boxShadow: `0 4px 15px ${color}66`
            }} onClick={() => setActiveJackpot(key)}>
              Play {j.name} Now
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Sports layout specific views ─────────────────────────────────────────────
const SportsContent = ({ activeSport, bets, toggleBet, activeSection, setActiveSection, setActiveJackpot }) => {
  // Sync sub-nav with top-level section
  const sectionToSubNav = {
    'Home':        'Highlights',
    'Live':        'Live',
    'Jackpots':    'Jackpots',
    'Aviator':     'Aviator',
    'Ligi Bigi':   'Highlights',
    'Virtuals':    'Highlights',
    'BetsWal Fasta':'Highlights',
    'Upcoming':    'Upcoming',
    'Countries':   'Countries',
  };
  const [activeSubNav, setActiveSubNav] = useState(sectionToSubNav[activeSection] || 'Highlights');

  // Keep sub-nav in sync when top navbar changes
  useEffect(() => {
    const mapped = sectionToSubNav[activeSection];
    if (mapped) setActiveSubNav(mapped);
  }, [activeSection]);

  const subnav = [
    { name: 'Highlights' },
    { name: 'Live', live: true },
    { name: 'Aviator', icon: '✈️' },
    { name: 'Upcoming' },
    { name: 'Countries' },
    { name: 'Jackpots' },
    { name: 'Zoom Soccer' },
    { name: 'Turbo', badge: true },
  ];

  const handleSubNav = (name) => {
    setActiveSubNav(name);
    // Propagate aviator sub-nav click to top-level
    if (name === 'Aviator') setActiveSection('Aviator');
    if (name === 'Live')    setActiveSection('Live');
    if (name === 'Jackpots') setActiveSection('Jackpots');
  };

  const noFilters = ['Jackpots', 'Aviator'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hero Banner (Only on Home) */}
      {activeSection === 'Home' && activeSubNav === 'Highlights' && (
        <div className="hero-bg animate-enter" style={{
          borderRadius: '16px', padding: '2.5rem 2rem', marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          minHeight: '220px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)', border: '1px solid rgba(134,196,57,0.12)'
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.12 }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '200px', height: '200px', background: '#fecd08', filter: 'blur(100px)', opacity: 0.07 }} />
          <div style={{ fontSize: '11px', color: 'var(--primary)', letterSpacing: '3px', fontWeight: 700, marginBottom: '10px', zIndex: 1 }}>⚡ AFRICA'S #1 BETTING PLATFORM</div>
          <h1 style={{ fontWeight: 900, fontSize: '34px', marginBottom: '8px', zIndex: 1, lineHeight: 1.1 }}>
            WELCOME TO <span className="text-gradient-primary">BETSWAL!</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '380px', marginBottom: '1.5rem', zIndex: 1, lineHeight: 1.6 }}>
            Join millions of winners. Bet on your favorite sports, play Aviator, and win massive Jackpots daily.
          </p>
          <div style={{ display: 'flex', gap: '10px', zIndex: 1, flexWrap: 'wrap' }}>
            <button className="btn btn-primary pulse-btn" style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800, borderRadius: '8px' }} onClick={() => setActiveSection('Register')}>
              PLAY NOW 🚀
            </button>
            <button className="btn" style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} onClick={() => setActiveSection('Aviator')}>
              ✈️ Try Aviator
            </button>
          </div>
        </div>
      )}

      {/* Sub Nav */}
      <div className="flex items-center gap-4" style={{ marginBottom: '1.25rem', fontWeight: 500, fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {subnav.map((item) => {
          const isActive = activeSubNav === item.name;
          return (
            <div
              key={item.name}
              onClick={() => handleSubNav(item.name)}
              style={{
                cursor: 'pointer',
                color: item.name === 'Aviator' ? (isActive ? '#fecd08' : '#fecd08aa') : isActive ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: isActive ? `2px solid ${item.name === 'Aviator' ? '#fecd08' : 'var(--primary)'}` : '2px solid transparent',
                paddingBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '5px',
                fontWeight: item.name === 'Aviator' ? 700 : isActive ? 600 : 400,
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                textShadow: isActive ? '0 0 8px rgba(134,196,57,0.35)' : 'none',
              }}
            >
              {item.live && <span style={{ width: '7px', height: '7px', backgroundColor: '#d32f2f', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite', boxShadow: '0 0 5px #d32f2f' }} />}
              {item.icon && <span>{item.icon}</span>}
              {item.name}
              {item.badge && <span style={{ background: 'linear-gradient(135deg, #d32f2f, #ff5252)', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>NEW</span>}
            </div>
          );
        })}
      </div>

      {/* Mobile Horizontal Sports Bar */}
      <div className="mobile-sports-bar" style={{ gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '1rem', scrollbarWidth: 'none' }}>
        {[
          { name: 'Soccer', icon: '⚽' },
          { name: 'Basketball', icon: '🏀' },
          { name: 'Tennis', icon: '🎾' },
          { name: 'Table Tennis', icon: '🏓' },
          { name: 'Boxing', icon: '🥊' },
          { name: 'Rugby', icon: '🏉' },
          { name: 'eSoccer', icon: '🎮' },
          { name: 'Cricket', icon: '🏏' },
          { name: 'Baseball', icon: '⚾' },
          { name: 'MMA', icon: '🥋' },
        ].map(sport => {
          const isActive = activeSport === sport.name;
          return (
            <button
              key={sport.name}
              onClick={() => setActiveSport(sport.name)}
              className="btn"
              style={{
                backgroundColor: isActive ? 'rgba(134,196,57,0.2)' : 'rgba(255,255,255,0.05)',
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                whiteSpace: 'nowrap', fontSize: '12px', padding: '6px 12px', borderRadius: '20px',
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0
              }}
            >
              <span>{sport.icon}</span> {sport.name}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {!noFilters.includes(activeSubNav) && (
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
          <button className="btn" style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }}>⚙️ Filters ⌄</button>
          <div className="flex gap-2">
            <button 
              className="btn" 
              style={{ backgroundColor: activeSubNav === 'Today' ? 'var(--primary)' : 'var(--bg-btn)', color: activeSubNav === 'Today' ? '#000' : 'var(--text-main)' }}
              onClick={() => setActiveSubNav('Today')}
            >
              Today ⌄
            </button>
            <button 
              className="btn" 
              style={{ backgroundColor: activeSubNav === 'Highlights' ? 'var(--primary)' : 'var(--bg-btn)', color: activeSubNav === 'Highlights' ? '#000' : 'var(--text-main)' }}
              onClick={() => setActiveSubNav('Highlights')}
            >
              Highlights ⌄
            </button>
            <button 
              className="btn" 
              style={{ backgroundColor: activeSubNav === '1x2' ? 'var(--primary)' : 'var(--bg-btn)', color: activeSubNav === '1x2' ? '#000' : 'var(--text-main)' }}
              onClick={() => setActiveSubNav('1x2')}
            >
              1x2 ⌄
            </button>
          </div>
        </div>
      )}

      {/* Panel content */}
      {activeSubNav === 'Live'     && <LivePanel      bets={bets} toggleBet={toggleBet} />}
      {activeSubNav === 'Jackpots' && <JackpotPanel setActiveJackpot={setActiveJackpot} />}
      {activeSubNav === 'Aviator'  && <AviatorGame />}
      {['Highlights','Upcoming','Countries','Zoom Soccer','Turbo','Today','1x2'].includes(activeSubNav) && (
        <HighlightsPanel activeSport={activeSport} bets={bets} toggleBet={toggleBet} />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ── Main content wrapper — top-level router ───────────────────────────────────
const MainContent = ({ activeSport, bets, toggleBet, activeSection, setActiveSection, setActiveJackpot }) => {
  switch (activeSection) {
    case 'Casino':       return <CasinoPage />;
    case 'Virtuals':     return <VirtualsPage bets={bets} toggleBet={toggleBet} />;
    case 'Crash Games':  return <CrashGamesPage setActiveSection={setActiveSection} />;
    case 'Ligi Bigi':    return <LigiBigiPage setActiveJackpot={setActiveJackpot} />;
    case 'Shikisha Bet': return <ShikishaPage bets={bets} toggleBet={toggleBet} />;
    case 'BetsWal Fasta': return <BetsWalFastaPage bets={bets} toggleBet={toggleBet} />;
    case 'Promotions':   return <PromotionsPage />;
    case 'Live Score':   return <LiveScorePage />;
    case 'App':          return <AppPage />;
    case 'Login':        return <AuthPage mode="login"  setActiveSection={setActiveSection} />;
    case 'Register':     return <AuthPage mode="register" setActiveSection={setActiveSection} />;
    case 'Deposit':      return <DepositPage setActiveSection={setActiveSection} />;
    case 'Withdraw':     return <WithdrawPage setActiveSection={setActiveSection} />;
    case 'Account':      return <AccountPage setActiveSection={setActiveSection} />;
    case 'Responsible':  return <ResponsiblePage setActiveSection={setActiveSection} />;
    case 'Profile':      return <ProfilePage setActiveSection={setActiveSection} />;
    case 'Admin':        return <AdminDashboard />;
    default:
      if (activeSection.startsWith('BetBuilder_')) {
        const matchId = activeSection.replace('BetBuilder_', '');
        return <BetBuilder matchId={matchId} bets={bets} toggleBet={toggleBet} setActiveSection={setActiveSection} />;
      }
      // Sports layout sections all share the SportsContent sub-router
      return (
        <SportsContent
          activeSport={activeSport}
          bets={bets}
          toggleBet={toggleBet}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setActiveJackpot={setActiveJackpot}
        />
      );
  }
};

export default MainContent;

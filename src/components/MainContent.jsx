import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import AviatorGame from './AviatorGame';
import {
  CasinoPage, VirtualsPage, CrashGamesPage, LigiBigiPage,
  ShikishaPage, StarBetFastaPage, PromotionsPage, LiveScorePage,
  AppPage, AuthPage,
} from './Pages';

// ── Flashing odds button ──────────────────────────────────────────────────────
const OddsBtn = ({ odd, prevOdd, selected, onClick, label }) => {
  const direction = prevOdd == null ? null : odd > prevOdd ? 'up' : odd < prevOdd ? 'down' : null;

  let bg = selected ? 'var(--primary)' : 'var(--bg-btn)';
  if (!selected && direction === 'up')   bg = 'rgba(40,167,69,0.55)';
  if (!selected && direction === 'down') bg = 'rgba(220,53,69,0.55)';

  return (
    <button
      className="odds-btn"
      style={{ backgroundColor: bg, color: selected ? '#000' : '#fff', position: 'relative', transition: 'background-color 0.35s ease', minWidth: '78px' }}
      onClick={onClick}
    >
      <span style={{ fontSize: '10px', color: selected ? '#000' : 'var(--text-muted)', display: 'block' }}>{label}</span>
      {typeof odd === 'number' ? odd.toFixed(2) : odd}
      {!selected && direction && (
        <span style={{ position: 'absolute', top: '-6px', right: '-2px', fontSize: '10px', color: direction === 'up' ? '#28a745' : '#dc3545' }}>
          {direction === 'up' ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
};

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
const HighlightsPanel = ({ bets, toggleBet }) => {
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

  if (!highlights.length) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading matches…</div>
  );

  return (
    <div>
      {highlights.map(match => (
        <div key={match.id} className="match-row">
          <div style={{ flex: 1, paddingRight: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>⚽ {match.country}</div>
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

          <div style={{ width: '100px', textAlign: 'right', fontSize: '12px', marginLeft: '1rem' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '4px', cursor: 'pointer' }}>+10 Markets</div>
            <div style={{ color: 'var(--text-muted)' }}>{match.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Jackpots panel ────────────────────────────────────────────────────────────
const JackpotPanel = () => {
  const { jackpot } = useSocket();
  const [prevAmounts, setPrevAmounts] = useState({});
  const prevRef = useRef({});

  useEffect(() => {
    if (!jackpot) return;
    const newPrev = {};
    Object.entries(jackpot).forEach(([key, j]) => { newPrev[key] = prevRef.current[key]; });
    setPrevAmounts(newPrev);
    Object.entries(jackpot).forEach(([key, j]) => { prevRef.current[key] = j.amount; });
  }, [jackpot]);

  if (!jackpot) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading jackpots…</div>;

  const format = (n) => n.toLocaleString('en-KE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Object.entries(jackpot).map(([key, j]) => {
        const grew = prevAmounts[key] != null && j.amount > prevAmounts[key];
        return (
          <div key={key} style={{
            background: 'linear-gradient(135deg, #1b242e, #2a3746)',
            border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{j.games} Games</div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>{j.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Min Stake: {j.currency} {j.minStake}</div>
                <div style={{
                  fontWeight: 800, fontSize: '22px',
                  color: grew ? '#28a745' : 'var(--secondary)',
                  transition: 'color 0.5s'
                }}>
                  {j.currency} {format(j.amount)} {grew && '🔥'}
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '10px', fontWeight: 700 }}>
              Play {j.name}
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Sports sub-nav (used when activeSection is a sports section) ──────────────
const SportsContent = ({ bets, toggleBet, activeSection, setActiveSection }) => {
  // Sync sub-nav with top-level section
  const sectionToSubNav = {
    'Home':        'Highlights',
    'Live':        'Live',
    'Jackpots':    'Jackpots',
    'Aviator':     'Aviator',
    'Ligi Bigi':   'Highlights',
    'Virtuals':    'Highlights',
    'StarBet Fasta':'Highlights',
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
          borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          minHeight: '200px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.15 }} />
          <h1 style={{ fontWeight: 900, fontSize: '36px', marginBottom: '8px', zIndex: 1 }}>
            WELCOME TO <span className="text-gradient-primary">STARBET!</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '400px', marginBottom: '1.5rem', zIndex: 1 }}>
            Join millions of winners. Bet on your favorite sports, play Aviator, and win massive Jackpots daily.
          </p>
          <button className="btn btn-primary pulse-btn" style={{ alignSelf: 'flex-start', padding: '12px 32px', fontSize: '15px', fontWeight: 800, borderRadius: '8px', zIndex: 1 }} onClick={() => setActiveSection('Register')}>
            PLAY NOW 🚀
          </button>
        </div>
      )}

      {/* Sub Nav */}
      <div className="flex items-center gap-4" style={{ marginBottom: '1rem', fontWeight: 500, fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', overflowX: 'auto' }}>
        {subnav.map((item) => {
          const isActive = activeSubNav === item.name;
          return (
            <div
              key={item.name}
              onClick={() => handleSubNav(item.name)}
              style={{
                cursor: 'pointer',
                color: item.name === 'Aviator' ? (isActive ? '#fecd08' : '#fecd08aa') : isActive ? '#fff' : 'var(--text-main)',
                borderBottom: isActive ? `2px solid ${item.name === 'Aviator' ? '#fecd08' : 'var(--primary)'}` : '2px solid transparent',
                paddingBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '5px',
                fontWeight: item.name === 'Aviator' ? 700 : 500,
                transition: 'color 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {item.live && <span style={{ width: '7px', height: '7px', backgroundColor: '#d32f2f', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />}
              {item.icon && <span>{item.icon}</span>}
              {item.name}
              {item.badge && <span style={{ backgroundColor: '#d32f2f', color: '#fff', fontSize: '10px', padding: '1px 4px', borderRadius: '4px' }}>New</span>}
            </div>
          );
        })}
      </div>

      {/* Filters */}
      {!noFilters.includes(activeSubNav) && (
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
          <button className="btn" style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }}>⚙️ Filters ⌄</button>
          <div className="flex gap-2">
            <button className="btn" style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }}>Today ⌄</button>
            <button className="btn" style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }}>Highlights ⌄</button>
            <button className="btn" style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }}>1x2 ⌄</button>
          </div>
        </div>
      )}

      {/* Panel content */}
      {activeSubNav === 'Live'     && <LivePanel      bets={bets} toggleBet={toggleBet} />}
      {activeSubNav === 'Jackpots' && <JackpotPanel />}
      {activeSubNav === 'Aviator'  && <AviatorGame />}
      {['Highlights','Upcoming','Countries','Zoom Soccer','Turbo'].includes(activeSubNav) && (
        <HighlightsPanel bets={bets} toggleBet={toggleBet} />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ── Main content wrapper — top-level router ───────────────────────────────────
const MainContent = ({ bets, toggleBet, activeSection, setActiveSection }) => {
  switch (activeSection) {
    case 'Casino':       return <CasinoPage />;
    case 'Virtuals':     return <VirtualsPage bets={bets} toggleBet={toggleBet} />;
    case 'Crash Games':  return <CrashGamesPage setActiveSection={setActiveSection} />;
    case 'Ligi Bigi':    return <LigiBigiPage />;
    case 'Shikisha Bet': return <ShikishaPage bets={bets} toggleBet={toggleBet} />;
    case 'StarBet Fasta': return <StarBetFastaPage bets={bets} toggleBet={toggleBet} />;
    case 'Promotions':   return <PromotionsPage />;
    case 'Live Score':   return <LiveScorePage />;
    case 'App':          return <AppPage />;
    case 'Login':        return <AuthPage mode="login"  setActiveSection={setActiveSection} />;
    case 'Register':     return <AuthPage mode="register" setActiveSection={setActiveSection} />;
    default:
      // Sports layout sections all share the SportsContent sub-router
      return (
        <SportsContent
          bets={bets}
          toggleBet={toggleBet}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      );
  }
};

export default MainContent;

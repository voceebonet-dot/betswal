import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser, COUNTRIES } from '../context/UserContext';
import CasinoModal from './CasinoModal';
import PromoModal from './PromoModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCountdown = (s) => {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

// ─── Casino Page ──────────────────────────────────────────────────────────────
export const CasinoPage = () => {
  const { casinoActivity, connected } = useSocket();
  const { formatCurrency } = useUser();
  const prev = React.useRef({});
  const [grew, setGrew] = React.useState({});
  const [catFilter, setCatFilter] = React.useState('All');
  const [activeGame, setActiveGame] = React.useState(null);

  React.useEffect(() => {
    if (!casinoActivity.length) return;
    const newGrew = {};
    casinoActivity.forEach(g => {
      if (prev.current[g.id] != null && g.players > prev.current[g.id]) newGrew[g.id] = true;
      prev.current[g.id] = g.players;
    });
    setGrew(newGrew);
    const t = setTimeout(() => setGrew({}), 700);
    return () => clearTimeout(t);
  }, [casinoActivity]);

  const ALL_GAMES = [
    // Live Dealer
    { id: 'live-roulette',   name: 'Live Roulette',       icon: '🎡', colour: '#dc3545', cat: 'Live Dealer', players: 843, hot: true,  desc: 'European & American tables' },
    { id: 'live-blackjack',  name: 'Live Blackjack',      icon: '🃏', colour: '#fecd08', cat: 'Live Dealer', players: 612, hot: true,  desc: 'Unlimited & Classic' },
    { id: 'live-baccarat',   name: 'Live Baccarat',       icon: '🎴', colour: '#00a651', cat: 'Live Dealer', players: 531, hot: true,  desc: 'Speed & Standard' },
    { id: 'live-dragon',     name: 'Dragon Tiger',        icon: '🐉', colour: '#ff4757', cat: 'Live Dealer', players: 298, hot: false, desc: 'Live Asia favourite' },
    { id: 'live-poker',      name: 'Casino Hold\'em',     icon: '♠️', colour: '#8e44ad', cat: 'Live Dealer', players: 207, hot: false, desc: 'Live poker vs dealer' },
    { id: 'live-wheel',      name: 'Dream Catcher',       icon: '🎪', colour: '#e67e22', cat: 'Live Dealer', players: 412, hot: false, desc: 'Money wheel 1x–40x' },
    { id: 'live-monopoly',   name: 'Monopoly Live',       icon: '🎩', colour: '#3498db', cat: 'Live Dealer', players: 566, hot: true,  desc: 'Wheel + 3D bonus round' },
    { id: 'live-teenpatti',  name: 'Teen Patti',          icon: '🤌', colour: '#9b59b6', cat: 'Live Dealer', players: 189, hot: false, desc: 'Indian card classic' },
    // Slots
    { id: 'slot-gates',      name: 'Gates of Olympus',   icon: '⚡', colour: '#fecd08', cat: 'Slots',       players: 1240, hot: true, desc: '6,000x max win' },
    { id: 'slot-sweet',      name: 'Sweet Bonanza',       icon: '🍬', colour: '#ff6b81', cat: 'Slots',       players: 987,  hot: true, desc: 'Cluster pays, 21,175x' },
    { id: 'slot-sugar',      name: 'Sugar Rush',          icon: '🍭', colour: '#f39c12', cat: 'Slots',       players: 654,  hot: false, desc: 'Tumble mechanic' },
    { id: 'slot-wanted',     name: 'Wanted Dead or Wild', icon: '🤠', colour: '#d35400', cat: 'Slots',       players: 432,  hot: false, desc: 'Wild West 12,345x' },
    { id: 'slot-fortune',    name: 'Fortune Tiger',       icon: '🐯', colour: '#f1c40f', cat: 'Slots',       players: 721,  hot: true,  desc: 'PG Soft tiger riches' },
    { id: 'slot-book',       name: 'Book of Dead',        icon: '📖', colour: '#e67e22', cat: 'Slots',       players: 389,  hot: false, desc: 'Egypt adventure' },
    { id: 'slot-legacy',     name: 'Legacy of Dead',      icon: '🏺', colour: '#c0392b', cat: 'Slots',       players: 287,  hot: false, desc: '5,000x potential' },
    { id: 'slot-wild',       name: 'Wild West Gold',      icon: '🌵', colour: '#27ae60', cat: 'Slots',       players: 341,  hot: false, desc: 'Sticky wilds bonanza' },
    // Table Games
    { id: 'table-craps',     name: 'Craps',               icon: '🎲', colour: '#1abc9c', cat: 'Table',       players: 156, hot: false, desc: 'Classic dice table' },
    { id: 'table-hilo',      name: 'Hi-Lo',               icon: '🔼', colour: '#3498db', cat: 'Table',       players: 203, hot: false, desc: 'Higher or lower' },
    { id: 'table-war',       name: 'Casino War',          icon: '⚔️', colour: '#e74c3c', cat: 'Table',       players: 127, hot: false, desc: 'Highest card wins' },
    { id: 'table-3card',     name: '3 Card Poker',        icon: '🂡', colour: '#8e44ad', cat: 'Table',       players: 98,  hot: false, desc: 'Pair Plus side bet' },
    // Instant Win
    { id: 'inst-spinwin',    name: 'Spin & Win',          icon: '🎰', colour: '#e67e22', cat: 'Instant',     players: 534, hot: true,  desc: 'Instant jackpots' },
    { id: 'inst-scratch',    name: 'Scratch Card',        icon: '🎫', colour: '#16a085', cat: 'Instant',     players: 421, hot: false, desc: 'Reveal your prize' },
    { id: 'inst-keno',       name: 'Keno',                icon: '🔢', colour: '#2980b9', cat: 'Instant',     players: 312, hot: false, desc: 'Pick 1–10 numbers' },
    { id: 'inst-bingo',      name: 'Bingo',               icon: '🎯', colour: '#c0392b', cat: 'Instant',     players: 267, hot: false, desc: '75 & 90 ball rooms' },
  ];

  const cats = ['All', 'Live Dealer', 'Slots', 'Table', 'Instant'];
  const filtered = catFilter === 'All' ? ALL_GAMES : ALL_GAMES.filter(g => g.cat === catFilter);

  // Merge live player data if available
  const games = filtered.map(g => {
    const live = casinoActivity.find(a => a.id === g.id);
    return live ? { ...g, players: live.players, lastWinAmount: live.lastWinAmount } : g;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#fff' }}>🎰 Casino</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {ALL_GAMES.length} games • Live dealer, slots, table & instant win
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: connected ? '#28a745' : '#dc3545' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connected ? '#28a745' : '#dc3545', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          {connected ? 'Live Player Counts' : 'Connecting…'}
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className="btn"
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px',
              backgroundColor: catFilter === c ? 'var(--primary)' : 'var(--bg-btn)',
              color: catFilter === c ? '#000' : 'var(--text-main)',
              border: catFilter === c ? 'none' : '1px solid var(--border-color)',
              transition: 'all 0.2s'
            }}>
            {c === 'All' ? `All (${ALL_GAMES.length})` : `${c} (${ALL_GAMES.filter(g => g.cat === c).length})`}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {games.map((g, idx) => (
          <div key={g.id} className="animate-enter glass-panel" style={{
            background: `linear-gradient(145deg, rgba(27,36,46,0.9), rgba(13,25,35,0.9))`,
            border: `1px solid ${grew[g.id] ? g.colour : g.colour + '2a'}`,
            borderRadius: '14px', padding: '1.25rem 1rem',
            textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: grew[g.id] ? `0 0 18px ${g.colour}44` : 'none',
            animationDelay: `${Math.min(idx * 0.04, 0.4)}s`,
            position: 'relative', overflow: 'hidden'
          }}
          onClick={() => setActiveGame(g)}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${g.colour}33`; e.currentTarget.style.borderColor = g.colour + '66'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = grew[g.id] ? `0 0 18px ${g.colour}44` : 'none'; e.currentTarget.style.borderColor = g.colour + '2a'; }}>
            {/* HOT / NEW badges */}
            {g.hot && <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#dc3545', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>🔥 HOT</div>}
            {g.isNew && <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#00a651', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>NEW</div>}
            <div style={{ fontSize: '40px', marginBottom: '8px', marginTop: g.hot ? '12px' : '0' }}>{g.icon}</div>
            <div style={{ fontWeight: 700, color: g.colour, marginBottom: '4px', fontSize: '13px' }}>{g.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{g.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
              <span style={{ color: grew[g.id] ? '#28a745' : 'var(--text-muted)', transition: 'color 0.3s' }}>🟢 {g.players.toLocaleString()}</span>
              <span style={{ color: '#fecd08', fontSize: '10px' }}>{g.cat}</span>
            </div>
            {g.lastWinAmount ? <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '10px' }}>Last win: <span style={{ color: '#fecd08' }}>{formatCurrency(g.lastWinAmount)}</span></div> : <div style={{ marginBottom: '10px', height: '15px' }} />}
            <button className="btn btn-primary" style={{ width: '100%', padding: '7px', fontWeight: 700, fontSize: '12px', borderRadius: '6px' }} onClick={(e) => { e.stopPropagation(); setActiveGame(g); }}>Play Now</button>
          </div>
        ))}
      </div>
      
      {/* Casino Game Modal */}
      <CasinoModal game={activeGame} onClose={() => setActiveGame(null)} />
      
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ─── Virtuals Page ────────────────────────────────────────────────────────────
export const VirtualsPage = ({ bets = [], toggleBet = () => {} }) => {
  const { virtualSports, connected } = useSocket();

  const sports = virtualSports.length ? virtualSports : [
    { id: 'vengland',  name: 'Virtual English League', icon: '⚽', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vspain',    name: 'Virtual Spanish League', icon: '⚽', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vitaly',    name: 'Virtual Italian League', icon: '⚽', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vfrance',   name: 'Virtual French League',  icon: '⚽', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vgermany',  name: 'Virtual German League',  icon: '⚽', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vchampions',name: 'Virtual Champions',      icon: '🏆', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vworld',    name: 'Virtual World Cup',      icon: '🌍', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vbasket',   name: 'Virtual Basketball',     icon: '🏀', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vtennis',   name: 'Virtual Tennis',         icon: '🎾', countdown: '--', odds: ['—', '—'], results: [] },
    { id: 'vhorses',   name: 'Virtual Horse Racing',   icon: '🐎', countdown: '--', odds: ['—', '—', '—', '—', '—'], results: [] },
    { id: 'vdogs',     name: 'Virtual Greyhounds',     icon: '🐕', countdown: '--', odds: ['—', '—', '—', '—', '—', '—'], results: [] },
    { id: 'vmotors',   name: 'Virtual Motor Racing',   icon: '🏎️', countdown: '--', odds: ['—', '—', '—', '—'], results: [] },
  ];

  const urgentColour = (cd) => cd <= 10 ? '#dc3545' : cd <= 30 ? '#fecd08' : 'var(--primary)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>🎮 Virtuals</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>24/7 virtual sports — real-time countdowns</p>
        </div>
        <div style={{ fontSize: '12px', color: connected ? '#28a745' : '#dc3545', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: connected ? '#28a745' : '#dc3545', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          {connected ? 'Live Countdowns' : 'Connecting…'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sports.map(vs => {
          const cd = typeof vs.countdown === 'number' ? vs.countdown : 0;
          const colour = urgentColour(cd);
          const betTypes = vs.odds.length === 2 ? ['Home', 'Away'] : vs.odds.length === 3 ? ['1', 'X', '2'] : vs.odds.map((_, i) => `#${i + 1}`);
          return (
            <div key={vs.id} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
              alignItems: 'center', gap: '1rem',
              background: '#1b242e', borderRadius: '10px', padding: '1rem 1.25rem',
              border: `1px solid ${cd <= 10 ? '#dc354533' : 'var(--border-color)'}`,
            }}>
              <div style={{ fontSize: '32px' }}>{vs.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{vs.name}</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {vs.results.slice(0, 5).map((r, i) => (
                    <span key={i} style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                      #{r.winnerIdx + 1}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {vs.odds.slice(0, 3).map((odd, i) => {
                  const type = i.toString(); // 0, 1, 2
                  const active = bets.some(b => b.matchId === vs.id && b.type === type);
                  return (
                    <button 
                      key={i} 
                      className="odds-btn pulse-btn" 
                      onClick={() => toggleBet({ id: vs.id, home: vs.name, away: 'Virtual Event' }, type, odd)}
                      style={{ 
                        backgroundColor: active ? 'var(--primary)' : 'var(--bg-btn)', 
                        color: active ? '#000' : '#fff', 
                        minWidth: '60px' 
                      }}
                    >
                      <span style={{ fontSize: '10px', color: active ? 'rgba(0,0,0,0.7)' : 'var(--text-muted)', display: 'block' }}>{betTypes[i]}</span>
                      {typeof odd === 'number' ? odd.toFixed(2) : odd}
                    </button>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', minWidth: '56px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Next in</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: colour, fontVariantNumeric: 'tabular-nums' }}>
                  {typeof vs.countdown === 'number' ? fmtCountdown(vs.countdown) : vs.countdown}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ─── Crash Games Page ─────────────────────────────────────────────────────────
export const CrashGamesPage = ({ setActiveSection }) => {
  const games = [
    { name: 'Aviator',       icon: '✈️', colour: '#fecd08', desc: 'The original crash game', section: 'Aviator',    players: 3420,  lastCrash: '1.24x', hot: true },
    { name: 'JetX',          icon: '🚀', colour: '#ff4757', desc: 'Rocket to the moon',      section: null,         players: 1845,  lastCrash: '4.50x', hot: true },
    { name: 'Spaceman',      icon: '👨‍🚀', colour: '#8e44ad', desc: 'Spaceman multiplier',   section: null,         players: 1120,  lastCrash: '2.10x', hot: false },
    { name: 'Cash or Crash', icon: '💰', colour: '#00a651', desc: 'Risk it all?',             section: null,         players: 840,   lastCrash: '7.80x', hot: false },
    { name: 'Balloon',       icon: '🎈', colour: '#e74c3c', desc: 'Pop before it bursts',    section: null,         players: 1653,  lastCrash: '1.05x', hot: false },
    { name: 'Plinko',        icon: '🔵', colour: '#3498db', desc: 'Drop the ball, win big',  section: null,         players: 2130,  lastCrash: null,    hot: true },
    { name: 'Mines',         icon: '💣', colour: '#e67e22', desc: 'Don\'t hit the mine',    section: null,         players: 955,   lastCrash: null,    hot: false },
    { name: 'Dice',          icon: '🎲', colour: '#1abc9c', desc: 'Roll for the win',        section: null,         players: 1245,  lastCrash: null,    hot: false },
    { name: 'Limbo',         icon: '📉', colour: '#9b59b6', desc: 'Target multiplier',       section: null,         players: 630,   lastCrash: null,    hot: false },
    { name: 'Tower',         icon: '🗼', colour: '#f39c12', desc: 'Climb the tower',         section: null,         players: 780,   lastCrash: null,    hot: false },
    { name: 'Keno',          icon: '🔢', colour: '#d35400', desc: 'Pick your numbers',       section: null,         players: 1450,  lastCrash: null,    hot: false },
    { name: 'Wheel',         icon: '🎡', colour: '#c0392b', desc: 'Spin the wheel',          section: null,         players: 1100,  lastCrash: null,    hot: false },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#fff' }}>🚀 Crash Games</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>High-volatility instant multiplier games</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#28a745' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28a745', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Live Network
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {games.map(g => (
          <div key={g.name} className="crash-card" onClick={() => g.section && setActiveSection(g.section)}
            style={{ 
              background: 'linear-gradient(135deg, rgba(27,36,46,0.9), rgba(13,25,35,0.9))', 
              backdropFilter: 'blur(10px)',
              border: `1px solid ${g.colour}44`, 
              borderRadius: '16px', 
              padding: '1.75rem 1.25rem', 
              textAlign: 'center', 
              cursor: g.section ? 'pointer' : 'default', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => { 
              if (g.section) { 
                e.currentTarget.style.transform = 'translateY(-6px)'; 
                e.currentTarget.style.boxShadow = `0 12px 32px ${g.colour}33, inset 0 0 20px ${g.colour}11`; 
                e.currentTarget.style.border = `1px solid ${g.colour}88`;
              } 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = 'none'; 
              e.currentTarget.style.boxShadow = 'none'; 
              e.currentTarget.style.border = `1px solid ${g.colour}44`;
            }}>
            {g.hot && <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#dc3545', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>HOT</div>}
            <div style={{ fontSize: '56px', marginBottom: '14px', filter: `drop-shadow(0 0 10px ${g.colour}88)` }}>{g.icon}</div>
            <div style={{ fontWeight: 800, color: g.colour, marginBottom: '6px', fontSize: '16px' }}>{g.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{g.desc}</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '12px', padding: '0 8px' }}>
              <span style={{ color: '#28a745' }}>🟢 {g.players.toLocaleString()}</span>
              {g.lastCrash && <span style={{ color: g.lastCrash.startsWith('1') ? '#dc3545' : '#fecd08' }}>💥 {g.lastCrash}</span>}
            </div>

            <span style={{ backgroundColor: g.section ? g.colour : g.colour + '22', color: g.section ? '#000' : g.colour, fontSize: '13px', fontWeight: 800, padding: '8px 24px', borderRadius: '8px', display: 'inline-block', width: '100%', transition: 'all 0.2s' }}>
              {g.section ? 'Play Now' : 'Coming Soon'}
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ─── BetsWal Fasta Page ────────────────────────────────────────────────────────
export const BetsWalFastaPage = ({ bets = [], toggleBet = () => {} }) => {
  const { fastaMarkets, connected } = useSocket();
  const prevOdds = useRef({});
  const [oddsDir, setOddsDir] = useState({});

  useEffect(() => {
    if (!fastaMarkets.length) return;
    const dirs = {};
    fastaMarkets.forEach(m => {
      m.odds.forEach((odd, idx) => {
        const key = `${m.id}-${idx}`;
        const prev = prevOdds.current[key];
        if (prev != null) dirs[key] = odd > prev ? 'up' : odd < prev ? 'down' : null;
        prevOdds.current[key] = odd;
      });
    });
    setOddsDir(dirs);
    const t = setTimeout(() => setOddsDir({}), 600);
    return () => clearTimeout(t);
  }, [fastaMarkets]);

  const markets = fastaMarkets.length ? fastaMarkets : [
    { id: 200, home: 'Loading…', away: 'Loading…', odds: [2.00, 3.20, 2.50], expiresIn: 60 },
  ];

  const urgentColour = (t) => t <= 10 ? '#dc3545' : t <= 20 ? '#fecd08' : 'var(--primary)';
  const betTypes = ['1', 'X', '2'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>⚡ BetsWal Fasta</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Ultra-fast 60-second markets — live odds every second</p>
        </div>
        <div style={{ fontSize: '12px', color: connected ? '#28a745' : '#dc3545', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: connected ? '#28a745' : '#dc3545', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          {connected ? 'Live' : 'Connecting…'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {markets.map(m => {
          const colour = urgentColour(m.expiresIn);
          const urgent = m.expiresIn <= 10;
          return (
            <div key={m.id} className="fasta-row" style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              alignItems: 'center', gap: '1rem',
              background: urgent ? 'rgba(220,53,69,0.06)' : '#1b242e',
              border: `1px solid ${urgent ? '#dc354544' : 'var(--border-color)'}`,
              borderRadius: '10px', padding: '1rem 1.25rem',
              transition: 'all 0.3s',
            }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{m.home}</div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{m.away}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {m.odds.map((odd, idx) => {
                  const key = `${m.id}-${idx}`;
                  const dir = oddsDir[key];
                  const selected = bets.some(b => b.matchId === m.id && b.type === betTypes[idx]);
                  let bg = selected ? 'var(--primary)' : 'var(--bg-btn)';
                  if (!selected && dir === 'up')   bg = 'rgba(40,167,69,0.5)';
                  if (!selected && dir === 'down') bg = 'rgba(220,53,69,0.5)';
                  return (
                    <button key={idx} className="odds-btn"
                      style={{ backgroundColor: bg, color: selected ? '#000' : '#fff', position: 'relative', transition: 'background-color 0.3s', minWidth: '64px' }}
                      onClick={() => toggleBet(m, betTypes[idx], odd)}>
                      <span style={{ fontSize: '10px', color: selected ? '#000' : 'var(--text-muted)', display: 'block' }}>{betTypes[idx]}</span>
                      {odd.toFixed(2)}
                      {!selected && dir && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-2px', fontSize: '10px', color: dir === 'up' ? '#28a745' : '#dc3545' }}>
                          {dir === 'up' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', minWidth: '52px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Closes</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: colour, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtCountdown(m.expiresIn)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ─── Live Score Page ──────────────────────────────────────────────────────────
export const LiveScorePage = () => {
  const { liveMatches, connected } = useSocket();

  const matches = liveMatches.length ? liveMatches : Array(5).fill(null).map((_, i) => ({
    id: i, country: 'Loading…', home: '—', away: '—', score: '- -', minute: '--', status: 'live',
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>📺 Live Scores</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Real-time scores powered by WebSocket</p>
        </div>
        <div style={{ fontSize: '12px', color: connected ? '#28a745' : '#dc3545', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connected ? '#28a745' : '#dc3545', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          {connected ? `${liveMatches.length} Live Matches` : 'Connecting…'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {matches.map(m => (
          <div key={m.id} className="live-score-row" style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 1fr',
            alignItems: 'center', gap: '1rem',
            background: '#1b242e', borderRadius: '8px', padding: '1rem 1.5rem',
            border: `1px solid ${m.status === 'finished' ? 'var(--border-color)' : 'rgba(220,53,69,0.2)'}`,
            opacity: m.status === 'finished' ? 0.6 : 1,
            cursor: 'pointer'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>⚽ {m.country}</div>
              <div style={{ fontWeight: 600, color: '#fff' }}>{m.home}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              {m.status === 'finished' ? (
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>FT</div>
              ) : (
                <div style={{ backgroundColor: '#d32f2f', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '3px', padding: '2px 6px', marginBottom: '6px', display: 'inline-block', animation: 'pulse 2s infinite' }}>
                  {m.minute}'
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: '22px', color: '#fff', letterSpacing: '3px' }}>{m.score}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>{m.away}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

// ─── Ligi Bigi Page ───────────────────────────────────────────────────────────
export const LigiBigiPage = ({ setActiveJackpot }) => {
  const { jackpot } = useSocket();
  const { formatCurrency } = useUser();
  const liga = jackpot?.liga;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '72px', marginBottom: '1rem', animation: 'pulseGlow 3s infinite' }}>🏆</div>
      <h1 className="text-gradient-gold" style={{ fontWeight: 800, fontSize: '36px', marginBottom: '0.5rem', display: 'inline-block' }}>Ligi Bigi</h1>
      {liga ? (
        <>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Predict {liga.games} games and win</p>
          <div className="text-gradient-gold" style={{ fontSize: '52px', fontWeight: 900, marginBottom: '0.5rem' }}>
            {formatCurrency(liga.amount)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2rem' }}>Jackpot amount — updates live</div>
          <button className="btn btn-primary" style={{ padding: '14px 40px', fontWeight: 800, fontSize: '16px', borderRadius: '8px' }} onClick={() => setActiveJackpot('liga')}>
            Play Ligi Bigi →
          </button>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Loading jackpot…</p>
      )}
    </div>
  );
};

// ─── Shikisha Bet Page ────────────────────────────────────────────────────────
export const ShikishaPage = ({ bets = [], toggleBet = () => {} }) => {
  const { highlights } = useSocket();
  const matches = highlights.slice(0, 5);

  return (
    <div>
      <div className="gradient-header" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '12px' }}>
        <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#fff' }}>🎯 Shikisha Bet</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Predict exact scores across all matches to win massive multipliers</p>
      </div>
      {matches.length ? matches.map(m => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>⚽ {m.country}</div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{m.home} vs {m.away}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {[['0-0','9.5'],['1-0','4.2'],['0-1','5.1'],['1-1','6.3'],['2-0','7.8'],['2-1','6.0']].map(([score, odd]) => {
              const selected = bets.some(b => b.matchId === m.id && b.type === score);
              return (
                <button 
                  key={score} 
                  className="odds-btn" 
                  style={{ 
                    backgroundColor: selected ? 'var(--primary)' : 'var(--bg-btn)', 
                    color: selected ? '#000' : '#fff', 
                    minWidth: '54px', 
                    fontSize: '12px',
                    borderColor: selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'
                  }}
                  onClick={() => toggleBet(m, score, parseFloat(odd))}
                >
                  <span style={{ fontSize: '9px', color: selected ? '#000' : 'var(--text-muted)', display: 'block' }}>{score}</span>
                  {odd}
                </button>
              );
            })}
          </div>
        </div>
      )) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading live matches…</div>
      )}
    </div>
  );
};

// ─── Promotions Page ──────────────────────────────────────────────────────────
export const PromotionsPage = () => {
  const { formatCurrency } = useUser();
  const [activePromo, setActivePromo] = React.useState(null);
  
  const promos = [
    { title: 'Welcome Bonus',     sub: `Get 100% on your first deposit up to ${formatCurrency(1000)}`, icon: '🎁', colour: '#00a651' },
    { title: 'Mega Jackpot Bonus',sub: `Predict all 17 games and win ${formatCurrency(100000000)}`,          icon: '💰', colour: '#fecd08' },
    { title: 'Aviator Free Rounds',sub: '5 free rounds every Friday for all users',       icon: '✈️', colour: '#ff4757' },
    { title: 'Refer a Friend',    sub: `Earn ${formatCurrency(200)} for every friend you refer`,         icon: '👥', colour: '#3498db' },
    { title: 'Cashback Tuesdays', sub: '10% cashback on all losing bets placed Tuesday',  icon: '🔄', colour: '#8e44ad' },
    { title: 'Loyalty Points',    sub: 'Earn points on every bet — redeem for free bets', icon: '⭐', colour: '#e67e22' },
    { title: 'Multibet Bonus',    sub: 'Get up to 100% bonus on winning 8+ leg multis',  icon: '📈', colour: '#1abc9c' },
    { title: 'Casino Cashback',   sub: '5% cashback on casino losses every Sunday',       icon: '🎰', colour: '#dc3545' },
    { title: 'Jackpot Insurance', sub: 'Miss by 1 game? Get 50% of your stake back',     icon: '🛡️', colour: '#fecd08' },
    { title: 'Daily Free Bet',    sub: `Login every day to claim your free ${formatCurrency(20)} bet`,  icon: '📅', colour: '#00a651' },
    { title: 'Boost Odds',        sub: 'Selected matches get 50% boosted odds daily',     icon: '🚀', colour: '#ff4757' },
    { title: 'VIP Club',          sub: 'Exclusive perks for high-volume bettors',         icon: '👑', colour: '#fecd08' },
    { title: 'Virtual Cash Bonus',sub: `${formatCurrency(100)} free bet for new Virtual players`,       icon: '🎮', colour: '#8e44ad' },
    { title: 'Aviator Multiplier',sub: 'Boosted multiplier weekend — double your flight', icon: '⚡', colour: '#e67e22' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>🎁 Promotions</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>14 active promotions — don't miss out!</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {promos.map((p, idx) => (
          <div key={p.title} className="animate-enter promo-card" style={{
            display: 'flex', alignItems: 'center', gap: '1.25rem',
            background: 'linear-gradient(135deg, rgba(27,36,46,0.8), rgba(13,25,35,0.8))',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${p.colour}33`, borderRadius: '12px', padding: '1.25rem 1.5rem',
            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animationDelay: `${Math.min(idx * 0.05, 0.5)}s`
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = p.colour; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${p.colour}22`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = p.colour + '33'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            {idx < 2 && <div className="promo-ribbon hot">HOT</div>}
            {idx === 2 && <div className="promo-ribbon">NEW</div>}
            <div style={{ fontSize: '36px', flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: p.colour, marginBottom: '3px' }}>{p.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.sub}</div>
            </div>
            <button className="btn" style={{ backgroundColor: p.colour + '22', color: p.colour, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setActivePromo(p); }}>
              Claim →
            </button>
          </div>
        ))}
      </div>
      
      {/* Promo Claim Modal */}
      <PromoModal promo={activePromo} onClose={() => setActivePromo(null)} />
    </div>
  );
};

// ─── App Download Page ────────────────────────────────────────────────────────
export const AppPage = () => (
  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
    <div style={{ fontSize: '80px', marginBottom: '1rem' }}>📱</div>
    <h2 style={{ fontWeight: 800, fontSize: '28px', color: '#fff', marginBottom: '1rem' }}>Get the BetsWal App</h2>
    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
      Bet on the go — faster, lighter, and smarter. Available on Android and iOS.
    </p>
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {[{ platform: 'App Store', os: '🍎', label: 'Download on the' }, { platform: 'Google Play', os: '🤖', label: 'Get it on' }].map(a => (
        <button key={a.platform} className="btn" style={{ backgroundColor: '#000', border: '1px solid #555', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px' }}>
          <span style={{ fontSize: '28px' }}>{a.os}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: '#aaa' }}>{a.label}</div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{a.platform}</div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ─── Auth Page ────────────────────────────────────────────────────────────────────
export const AuthPage = ({ mode = 'login', setActiveSection }) => {
  const isLogin = mode === 'login';
  const { country, changeCountry, requestOtp, verifyOtp } = useUser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('details'); // 'details' or 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (step === 'details') {
      if (!phone.trim() || !password.trim()) { setError('Phone and password are required.'); return; }
      if (!isLogin && !name.trim()) { setError('Full name is required.'); return; }
      
      setLoading(true);
      const res = await requestOtp(phone.trim());
      setLoading(false);
      
      if (res && res.ok) {
        setStep('otp');
      } else {
        setError(res?.error || 'Failed to send OTP.');
      }
    } else if (step === 'otp') {
      if (!otpCode.trim()) { setError('OTP code is required.'); return; }
      
      setLoading(true);
      const res = await verifyOtp(phone.trim(), otpCode.trim(), !isLogin ? name.trim() : '', country.id, referredBy.trim());
      
      if (res && res.ok) {
        setLoading(false);
        setActiveSection('Home');
      } else {
        setLoading(false);
        setError(res?.error || 'Invalid OTP code.');
      }
    }
  };
  return (
    <div className="glass-panel animate-enter" style={{ maxWidth: '400px', margin: '3rem auto', padding: '2.5rem 2rem', borderRadius: '16px' }}>
      <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '22px', marginBottom: '1.5rem' }}>
        {isLogin ? '🔐 Login' : '📝 Create Account'}
      </h2>
      {step === 'details' ? (
        <>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Country of Registration</label>
                <div className="auth-input-container">
                  <i>🌍</i>
                  <select
                    value={country.id}
                    onChange={(e) => changeCountry(e.target.value)}
                    className="glow-focus auth-input"
                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-btn)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none', transition: 'all 0.2s', appearance: 'none' }}
                  >
                    {Object.values(COUNTRIES).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <div className="auth-input-container">
                  <i>👤</i>
                  <input type="text" className="glow-focus auth-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-btn)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none', transition: 'all 0.2s' }} />
                </div>
              </div>
            </>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
            <div className="auth-input-container">
              <i>📱</i>
              <input type="tel" className="glow-focus auth-input" placeholder="+254 7XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-btn)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none', transition: 'all 0.2s' }} />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password</label>
            <div className="auth-input-container">
              <i>🔒</i>
              <input type="password" className="glow-focus auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-btn)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none', transition: 'all 0.2s' }} />
            </div>
          </div>
          {!isLogin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Referral Code (Optional)</label>
              <div className="auth-input-container">
                <i>🎁</i>
                <input type="text" className="glow-focus auth-input" placeholder="e.g. BW-ABC123" value={referredBy} onChange={e => setReferredBy(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-btn)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none', transition: 'all 0.2s', textTransform: 'uppercase' }} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Enter SMS Code sent to {phone}</label>
          <div className="auth-input-container">
            <i>💬</i>
            <input type="text" className="glow-focus auth-input" placeholder="123456" value={otpCode} onChange={e => setOtpCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-btn)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none', transition: 'all 0.2s', letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }} maxLength={6} />
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setStep('details')}>Back to Details</span>
          </div>
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.35)', borderRadius: '6px', padding: '8px 12px', color: '#dc3545', fontSize: '12px', marginBottom: '1rem', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}
      <button className="btn btn-primary pulse-btn" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 800, borderRadius: '8px', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
        {loading ? '⏳ Please wait…' : step === 'otp' ? 'Verify & Login' : isLogin ? 'Send SMS Code' : 'Create Account (Send SMS)'}
      </button>
      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: 'var(--text-muted)' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setActiveSection(isLogin ? 'Register' : 'Login')}>
          {isLogin ? 'Register' : 'Login'}
        </span>
      </div>
    </div>
  );
};


// --- Deposit Page ---
export const DepositPage = ({ setActiveSection }) => {
  const { user, wallet, deposit, formatCurrency, country } = useUser();
  const [amount, setAmount] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];
  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '60px', marginBottom: '1rem' }}>🔐</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You must be logged in to deposit.</p>
      <button className='btn btn-primary' onClick={() => setActiveSection('Login')}>Login Now</button>
    </div>
  );
  const handleDeposit = () => {
    const result = deposit(parseFloat(amount));
    if (result.ok) { setMsg('Deposited!'); setAmount(''); }
    else setMsg('Error: ' + result.error);
    setTimeout(() => setMsg(''), 3000);
  };
  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff', marginBottom: '0.5rem' }}>💳 Deposit Funds</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1.5rem' }}>Balance: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(wallet)}</span></p>
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Amount ({country.symbol})</label>
        <input type='number' min='10' className='glow-focus' value={amount} onChange={e => setAmount(e.target.value)} placeholder='Enter amount' style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '16px', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem' }}>
          {quickAmounts.map(a => <button key={a} className='btn' onClick={() => setAmount(a.toString())} style={{ backgroundColor: amount == a ? 'var(--primary)' : 'var(--bg-btn)', color: amount == a ? '#000' : 'var(--text-main)', fontWeight: 600 }}>{country.symbol}{a}</button>)}
        </div>
        <button className='btn btn-primary' style={{ width: '100%', padding: '14px', fontWeight: 800 }} onClick={handleDeposit}>Deposit Now</button>
        {msg && <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 600, color: '#28a745' }}>{msg}</div>}
      </div>
    </div>
  );
};

// --- Withdraw Page ---
export const WithdrawPage = ({ setActiveSection }) => {
  const { user, wallet, withdraw, formatCurrency, country } = useUser();
  const [amount, setAmount] = React.useState('');
  const [msg, setMsg] = React.useState('');
  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '60px', marginBottom: '1rem' }}>🔐</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You must be logged in to withdraw.</p>
      <button className='btn btn-primary' onClick={() => setActiveSection('Login')}>Login Now</button>
    </div>
  );
  const handleWithdraw = () => {
    const result = withdraw(parseFloat(amount));
    if (result.ok) { 
      setMsg(result.pending ? 'Request sent to admin for approval!' : 'Withdrawal processed!'); 
      setAmount(''); 
    }
    else setMsg('Error: ' + result.error);
    setTimeout(() => setMsg(''), 4000);
  };
  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff', marginBottom: '0.5rem' }}>💸 Withdraw Funds</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1.5rem' }}>Available: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(wallet)}</span></p>
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Amount ({country.symbol})</label>
        <input type='number' min='10' className='glow-focus' value={amount} onChange={e => setAmount(e.target.value)} placeholder='Enter amount' style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '16px', marginBottom: '1.25rem' }} />
        <button className='btn' style={{ width: '100%', padding: '14px', fontWeight: 800, backgroundColor: '#dc3545', color: '#fff' }} onClick={handleWithdraw}>Withdraw</button>
        {msg && <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 600 }}>{msg}</div>}
      </div>
    </div>
  );
};

// --- Account Page ---
export const AccountPage = ({ setActiveSection }) => {
  const { user, wallet, formatCurrency, transactions } = useUser();
  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <button className='btn btn-primary' onClick={() => setActiveSection('Login')}>Login to view account</button>
    </div>
  );
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff', marginBottom: '1.5rem' }}>👤 My Account</h2>
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fecd08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '22px', color: '#000' }}>{user.name ? user.name[0].toUpperCase() : '?'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>{user.name || 'User'}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user.phone}</div>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1rem' }}>Balance: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(wallet)}</span></p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className='btn btn-primary' style={{ flex: 1 }} onClick={() => setActiveSection('Deposit')}>+ Deposit</button>
          <button className='btn' style={{ flex: 1, backgroundColor: 'var(--bg-btn)', color: 'var(--text-main)' }} onClick={() => setActiveSection('Withdraw')}>Withdraw</button>
        </div>
      </div>
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Transaction History</div>
        {transactions.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No transactions yet.</p>
          : transactions.slice(0, 15).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.type === 'deposit' ? '💳 Deposit' : t.type === 'winnings' ? '🏆 Winnings' : t.type === 'bet_stake' ? '🎯 Bet' : '💸 Withdrawal'} — {new Date(t.date).toLocaleDateString()}</span>
              <span style={{ fontWeight: 700, color: ['deposit','winnings'].includes(t.type) ? '#28a745' : '#dc3545' }}>{['deposit','winnings'].includes(t.type) ? '+' : '-'}{formatCurrency(t.amount)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

// --- Responsible Gambling Page ---
export const ResponsiblePage = ({ setActiveSection }) => {
  const { user, spendLimit, setDailyLimit, setWeeklyLimit, excludeSelf, realityCheck, setRealityCheck } = useUser();
  const [dailyInput, setDailyInput] = React.useState(spendLimit.daily || '');
  const [weeklyInput, setWeeklyInput] = React.useState(spendLimit.weekly || '');
  const [msg, setMsg] = React.useState('');
  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <button className='btn btn-primary' onClick={() => setActiveSection('Login')}>Login to manage settings</button>
    </div>
  );
  const save = () => {
    if (dailyInput) setDailyLimit(dailyInput);
    if (weeklyInput) setWeeklyLimit(weeklyInput);
    setMsg('Settings saved!');
    setTimeout(() => setMsg(''), 2000);
  };
  return (
    <div style={{ maxWidth: '540px', margin: '2rem auto' }}>
      <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff', marginBottom: '0.5rem' }}>🛡️ Responsible Play</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1.5rem' }}>Set limits to stay in control.</p>
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Daily Spend Limit</label><input type='number' value={dailyInput} onChange={e => setDailyInput(e.target.value)} placeholder='e.g. 500' className='glow-focus' style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none' }} /></div>
        <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Weekly Spend Limit</label><input type='number' value={weeklyInput} onChange={e => setWeeklyInput(e.target.value)} placeholder='e.g. 2000' className='glow-focus' style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none' }} /></div>
        <div><label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Reality Check (minutes)</label><input type='number' value={realityCheck} onChange={e => setRealityCheck(parseInt(e.target.value) || 0)} placeholder='e.g. 60' className='glow-focus' style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', outline: 'none' }} /></div>
        <button className='btn btn-primary' style={{ padding: '12px', fontWeight: 700 }} onClick={save}>Save Settings</button>
        {msg && <div style={{ textAlign: 'center', color: '#28a745', fontWeight: 600 }}>{msg}</div>}
      </div>
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(220,53,69,0.2)' }}>
        <div style={{ fontWeight: 700, color: '#dc3545', marginBottom: '0.5rem' }}>⛔ Self-Exclusion</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1rem' }}>Exclude yourself from betting. This cannot be reversed.</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[7, 14, 30, 90].map(days => (
            <button key={days} className='btn' style={{ backgroundColor: 'rgba(220,53,69,0.1)', color: '#dc3545', border: '1px solid rgba(220,53,69,0.3)' }}
              onClick={() => { if (window.confirm('Self-exclude for ' + days + ' days?')) { excludeSelf(days); setActiveSection('Home'); } }}>
              {days} Days
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Profile Page ──────────────────────────────────────────────────────────────
export const ProfilePage = ({ setActiveSection }) => {
  const { user, wallet, formatCurrency } = useUser();
  const [tab, setTab] = React.useState('Bets');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const API_URL = import.meta.env.VITE_API_URL || '';

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    const token = localStorage.getItem('betswal_token');
    fetch(`${API_URL}/api/user/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) setData(d);
        else setError(d.error || 'Failed to load history');
        setLoading(false);
      })
      .catch(() => { setError('Network error'); setLoading(false); });
  }, [user]);

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '60px', marginBottom: '1rem' }}>👤</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Please log in to view your profile.</p>
      <button className='btn btn-primary' onClick={() => setActiveSection('Login')}>Login Now</button>
    </div>
  );

  const tabStyle = (t) => ({
    padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
    color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
    background: 'none', border: 'none', transition: 'all 0.2s',
  });

  const statusColor = (s) => s === 'Won' ? '#86c439' : s === 'Lost' ? '#dc3545' : '#ffc107';

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Profile Header Card */}
      <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #00d2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
          👤
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{user.name || 'BetsWal User'}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user.phone}</div>
          {user.referralCode && (
            <div style={{ color: 'var(--primary)', fontSize: '12px', marginTop: '6px', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(user.referralCode); alert('Referral code copied!'); }}>
              Referral Code: <strong style={{ letterSpacing: '1px' }}>{user.referralCode}</strong> 📋
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Balance', value: formatCurrency(wallet), color: 'var(--primary)' },
            { label: 'Bets Placed', value: data?.bets?.length ?? '—', color: '#fecd08' },
            { label: 'Jackpot Tickets', value: data?.jackpotTickets?.length ?? '—', color: '#e74c3c' },
          ].map(k => (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {['Bets', 'Transactions', 'Jackpot Tickets', 'Stats'].map(t => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading history...</div>}
      {error && <div style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>{error}</div>}

      {/* BETS TAB */}
      {!loading && !error && tab === 'Bets' && (
        <div className='glass-panel' style={{ padding: '1.25rem', borderRadius: '12px' }}>
          {data?.bets?.length > 0 ? data.bets.map((bet, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.bets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'monospace', color: '#fecd08', fontSize: '12px', marginBottom: '4px' }}>{bet.ticketRef}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(bet.createdAt).toLocaleString()} · {bet.bets?.length || 0} selections</div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stake</div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(bet.stake)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Potential Win</div>
                  <div style={{ fontWeight: 700, color: '#86c439' }}>{formatCurrency(bet.possibleWin)}</div>
                </div>
                <div style={{ minWidth: '60px', textAlign: 'center', fontWeight: 700, color: statusColor(bet.status), fontSize: '13px', background: `${statusColor(bet.status)}22`, borderRadius: '6px', padding: '4px 10px' }}>{bet.status}</div>
              </div>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No bets placed yet.</div>}
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {!loading && !error && tab === 'Transactions' && (
        <div className='glass-panel' style={{ padding: '1.25rem', borderRadius: '12px' }}>
          {data?.transactions?.length > 0 ? data.transactions.map((t, i) => {
            const isCredit = ['deposit', 'winnings'].includes(t.type);
            const icons = { deposit: '💳', winnings: '🏆', bet_stake: '🎯', withdrawal: '💸' };
            const labels = { deposit: 'Deposit', winnings: 'Winnings', bet_stake: 'Bet Stake', withdrawal: 'Withdrawal' };
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.transactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isCredit ? 'rgba(40,167,69,0.15)' : 'rgba(220,53,69,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    {icons[t.type] || '💰'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{labels[t.type] || t.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: isCredit ? '#28a745' : '#dc3545', fontSize: '16px' }}>
                  {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
              </div>
            );
          }) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions yet.</div>}
        </div>
      )}

      {/* JACKPOT TICKETS TAB */}
      {!loading && !error && tab === 'Jackpot Tickets' && (
        <div className='glass-panel' style={{ padding: '1.25rem', borderRadius: '12px' }}>
          {data?.jackpotTickets?.length > 0 ? data.jackpotTickets.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.jackpotTickets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'monospace', color: '#fecd08', fontSize: '12px', marginBottom: '4px' }}>{t.ticketRef}</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px', marginBottom: '2px' }}>{t.jackpotName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stake</div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(t.stake)}</div>
                </div>
                <div style={{ minWidth: '60px', textAlign: 'center', fontWeight: 700, color: statusColor(t.status), fontSize: '13px', background: `${statusColor(t.status)}22`, borderRadius: '6px', padding: '4px 10px' }}>{t.status}</div>
              </div>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No jackpot tickets yet.</div>}
        </div>
        </div>
      )}

      {/* STATS TAB */}
      {!loading && !error && tab === 'Stats' && (
        <div className='glass-panel' style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Dashboard Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Won</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#86c439' }}>{formatCurrency(user.totalWon || 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Deposited</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fecd08' }}>{formatCurrency(user.totalDeposited || 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Bets</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{user.totalBets || 0}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Referrals Made</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{user.referralCount || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

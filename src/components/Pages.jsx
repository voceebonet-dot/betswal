import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser, COUNTRIES } from '../context/UserContext';

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
  const prev = useRef({});
  const [grew, setGrew] = useState({});

  useEffect(() => {
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

  const games = casinoActivity.length ? casinoActivity : [
    { id: 'roulette', name: 'Roulette', icon: '🎡', colour: '#dc3545', players: '...', lastWinAmount: 0 },
    { id: 'blackjack', name: 'Blackjack', icon: '🃏', colour: '#fecd08', players: '...', lastWinAmount: 0 },
    { id: 'baccarat', name: 'Baccarat', icon: '🎴', colour: '#00a651', players: '...', lastWinAmount: 0 },
    { id: 'dragon', name: 'Dragon Tiger', icon: '🐉', colour: '#ff4757', players: '...', lastWinAmount: 0 },
    { id: 'teenpatti', name: 'Teen Patti', icon: '🤌', colour: '#8e44ad', players: '...', lastWinAmount: 0 },
    { id: 'spinwin', name: 'Spin & Win', icon: '🎰', colour: '#e67e22', players: '...', lastWinAmount: 0 },
    { id: 'dice', name: 'Dice', icon: '🎲', colour: '#1abc9c', players: '...', lastWinAmount: 0 },
    { id: 'hilo', name: 'Hi-Lo', icon: '🔼', colour: '#3498db', players: '...', lastWinAmount: 0 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>🎰 Casino</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Live dealer and instant-win games</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: connected ? '#28a745' : '#dc3545' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connected ? '#28a745' : '#dc3545', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          {connected ? 'Live Player Data' : 'Connecting…'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {games.map((g, idx) => (
          <div key={g.id} className="animate-enter glass-panel" style={{
            background: `linear-gradient(135deg, rgba(27,36,46,0.8), rgba(13,25,35,0.8))`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${grew[g.id] ? g.colour : g.colour + '33'}`,
            borderRadius: '12px', padding: '1.5rem 1rem',
            textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: grew[g.id] ? `0 0 16px ${g.colour}55` : 'none',
            animationDelay: `${Math.min(idx * 0.05, 0.5)}s`
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${g.colour}44`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = grew[g.id] ? `0 0 16px ${g.colour}55` : 'none'; }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>{g.icon}</div>
            <div style={{ fontWeight: 700, color: g.colour, marginBottom: '6px' }}>{g.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>🟢 {g.players} playing</span>
              <span style={{ color: '#28a745', fontWeight: 600 }}>↑</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Last win: <span style={{ color: '#fecd08' }}>{g.lastWinAmount ? formatCurrency(g.lastWinAmount) : '—'}</span></div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '8px', fontWeight: 700, fontSize: '12px' }}>Play Now</button>
          </div>
        ))}
      </div>
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
    { id: 'vchampions',name: 'Virtual Champions',      icon: '🏆', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vworld',    name: 'Virtual World Cup',      icon: '🌍', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vbasket',   name: 'Virtual Basketball',     icon: '🏀', countdown: '--', odds: ['—', '—', '—'], results: [] },
    { id: 'vhorses',   name: 'Virtual Horse Racing',   icon: '🐎', countdown: '--', odds: ['—', '—', '—', '—', '—'], results: [] },
    { id: 'vdogs',     name: 'Virtual Greyhounds',     icon: '🐕', countdown: '--', odds: ['—', '—', '—', '—', '—', '—'], results: [] },
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
    { name: 'Aviator',       icon: '✈️', colour: '#fecd08', desc: 'The original crash game', section: 'Aviator' },
    { name: 'JetX',          icon: '🚀', colour: '#ff4757', desc: 'Rocket to the moon',      section: null },
    { name: 'Spaceman',      icon: '👨‍🚀', colour: '#8e44ad', desc: 'Spaceman multiplier',   section: null },
    { name: 'Cash or Crash', icon: '💰', colour: '#00a651', desc: 'Risk it all?',             section: null },
    { name: 'Balloon',       icon: '🎈', colour: '#e74c3c', desc: 'Pop before it bursts',    section: null },
    { name: 'Plinko',        icon: '🔵', colour: '#3498db', desc: 'Drop the ball, win big',  section: null },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '22px', color: '#fff' }}>🚀 Crash Games</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>High-volatility instant multiplier games</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {games.map(g => (
          <div key={g.name} className="crash-card" onClick={() => g.section && setActiveSection(g.section)}
            style={{ 
              background: 'linear-gradient(135deg, rgba(27,36,46,0.8), rgba(13,25,35,0.8))', 
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
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>{g.icon}</div>
            <div style={{ fontWeight: 700, color: g.colour, marginBottom: '6px' }}>{g.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{g.desc}</div>
            <span style={{ backgroundColor: g.colour + '22', color: g.colour, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
              {g.section ? 'Play Now →' : 'Coming Soon'}
            </span>
          </div>
        ))}
      </div>
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
export const LigiBigiPage = () => {
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
          <button className="btn btn-primary" style={{ padding: '14px 40px', fontWeight: 800, fontSize: '16px', borderRadius: '8px' }}>
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
export const ShikishaPage = () => {
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
            {[['0-0','9.5'],['1-0','4.2'],['0-1','5.1'],['1-1','6.3'],['2-0','7.8'],['2-1','6.0']].map(([score, odd]) => (
              <button key={score} className="odds-btn" style={{ backgroundColor: 'var(--bg-btn)', color: '#fff', minWidth: '54px', fontSize: '12px' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>{score}</span>
                {odd}
              </button>
            ))}
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
            <button className="btn" style={{ backgroundColor: p.colour + '22', color: p.colour, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Claim →
            </button>
          </div>
        ))}
      </div>
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
  const { country, changeCountry, register, login } = useUser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError('');
    if (!phone.trim() || !password.trim()) { setError('Phone and password are required.'); return; }
    if (!isLogin && !name.trim()) { setError('Full name is required.'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = isLogin
        ? login(phone.trim(), password)
        : register(name.trim(), phone.trim(), password, country.id);
      setLoading(false);
      if (result.ok) {
        setActiveSection('Home');
      } else {
        setError(result.error || 'Something went wrong.');
      }
    }, 400);
  };
  return (
    <div className="glass-panel animate-enter" style={{ maxWidth: '400px', margin: '3rem auto', padding: '2.5rem 2rem', borderRadius: '16px' }}>
      <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '22px', marginBottom: '1.5rem' }}>
        {isLogin ? '🔐 Login' : '📝 Create Account'}
      </h2>
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
      {error && (
        <div style={{ backgroundColor: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.35)', borderRadius: '6px', padding: '8px 12px', color: '#dc3545', fontSize: '12px', marginBottom: '1rem', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}
      <button className="btn btn-primary pulse-btn" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 800, borderRadius: '8px', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
        {loading ? '⏳ Please wait…' : isLogin ? 'Login' : 'Create Account'}
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
    if (result.ok) { setMsg('Withdrawal requested!'); setAmount(''); }
    else setMsg('Error: ' + result.error);
    setTimeout(() => setMsg(''), 3000);
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

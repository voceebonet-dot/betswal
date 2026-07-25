import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

// ─── Colour helpers ────────────────────────────────────────────────────────────
const crashColour = (v) => {
  if (v < 2)  return '#8496a8';
  if (v < 5)  return '#86c439';
  if (v < 10) return '#fecd08';
  return '#ff4757';
};
const multiplierToColor = (v) => {
  if (v < 2)  return '#86c439';
  if (v < 5)  return '#fecd08';
  if (v < 10) return '#ff9f43';
  return '#ff4757';
};

// ─── Fake players pool ─────────────────────────────────────────────────────────
const NAMES = ['Alex', 'Kamau', 'Victor', 'Nancy', 'Patrick', 'Grace', 'Brian', 'Wanjiku',
  'Peter', 'Amina', 'John', 'Fatuma', 'James', 'Aisha', 'Daniel', 'Otieno',
  'Mark', 'Njeri', 'Samuel', 'Zawadi', 'Felix', 'Rose', 'Kevin', 'Lydiah',
  'Moses', 'Miriam', 'David', 'Esther', 'Paul', 'Ruth', 'Simon', 'Charity'];

const randomBet   = () => [20,50,100,200,500,1000,2000,5000][Math.floor(Math.random()*8)];
const randomName  = () => NAMES[Math.floor(Math.random() * NAMES.length)];
const randomHash  = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// ─── Emoji Reactions ──────────────────────────────────────────────────────────
const REACTIONS = ['🔥','💰','🚀','😱','🎯','💎','⚡','🏆'];
const FloatingReactions = ({ reactions }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {reactions.map(r => (
      <div key={r.id} style={{
        position: 'absolute', left: `${r.x}%`, bottom: '20%',
        fontSize: '24px', animation: 'floatUp 2.5s ease-out forwards',
        filter: 'drop-shadow(0 0 6px rgba(254,205,8,0.8))',
      }}>{r.emoji}</div>
    ))}
  </div>
);

// ─── Session Stats ────────────────────────────────────────────────────────────
const useSessionStats = () => {
  const [stats, setStats] = useState({ rounds: 0, won: 0, lost: 0, totalWin: 0, bigWin: 0 });
  const record = useCallback((win, amount = 0) => {
    setStats(prev => ({
      rounds: prev.rounds + 1,
      won:    win ? prev.won + 1 : prev.won,
      lost:   win ? prev.lost : prev.lost + 1,
      totalWin: prev.totalWin + amount,
      bigWin: Math.max(prev.bigWin, amount),
    }));
  }, []);
  return { stats, record };
};

const generatePlayers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i, name: randomName(), bet: randomBet(), cashedAt: null, status: 'waiting',
  }));

// ─── SVG Plane ────────────────────────────────────────────────────────────────
const PlaneSVG = ({ color = '#86c439', size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ filter: `drop-shadow(0 4px 12px ${color}99)` }}>
    <path d="M4 22 Q0 24 4 26 Q-4 24 4 22Z" fill="#ff9f43" style={{ animation: 'flickerRed 0.1s infinite alternate' }} />
    <path d="M4 24L44 8L36 24L44 40L4 24Z" fill={color} />
    <path d="M4 24L20 28L18 36L4 24Z" fill={color + 'aa'} />
    <path d="M20 16L28 8L30 16L20 16Z" fill={color + 'cc'} />
  </svg>
);

// ─── Stars background ──────────────────────────────────────────────────────────
const Stars = ({ crashed, phase }) => {
  const stars = useRef(
    Array.from({ length: 100 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5, delay: Math.random() * 4,
      speed: Math.random() * 2 + 1,
      parallax: Math.random() * 0.5 + 0.1,
    }))
  );
  
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    if (phase !== 'flying') return;
    let start = Date.now();
    let frame;
    const loop = () => {
      setOffset((Date.now() - start) / 50);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.current.map((s, i) => {
        const xPos = (s.x - (phase === 'flying' ? offset * s.parallax : 0)) % 100;
        const normalizedX = xPos < 0 ? 100 + xPos : xPos;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${normalizedX}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            backgroundColor: crashed ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.6)',
            borderRadius: '50%',
            animation: `twinkle ${s.speed}s ${s.delay}s infinite alternate`,
            transition: 'background-color 0.5s',
            boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.3)`,
          }} />
        );
      })}
    </div>
  );
};

// ─── Explosion particles on crash ─────────────────────────────────────────────
const Explosion = ({ x, y }) => {
  const particles = useRef(
    Array.from({ length: 24 }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 80 + 40,
      size: Math.random() * 8 + 3,
      color: ['#dc3545','#ff4757','#fecd08','#ff9f43'][Math.floor(Math.random()*4)],
    }))
  );
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {particles.current.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: '50%',
          backgroundColor: p.color,
          animation: `explode${i % 4} 0.8s ease-out forwards`,
          boxShadow: `0 0 6px ${p.color}`,
        }} />
      ))}
      <style>{`
        @keyframes explode0 { to { transform: translate(${Math.random()*80-40}px, ${-Math.random()*80}px) scale(0); opacity: 0; } }
        @keyframes explode1 { to { transform: translate(${Math.random()*80-40}px, ${-Math.random()*80}px) scale(0); opacity: 0; } }
        @keyframes explode2 { to { transform: translate(${Math.random()*80-40}px, ${-Math.random()*80}px) scale(0); opacity: 0; } }
        @keyframes explode3 { to { transform: translate(${Math.random()*80-40}px, ${-Math.random()*80}px) scale(0); opacity: 0; } }
      `}</style>
    </div>
  );
};

// ─── Big Win Toast ─────────────────────────────────────────────────────────────
const BigWinToast = ({ toasts }) => (
  <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: 'linear-gradient(135deg, rgba(254,205,8,0.95) 0%, rgba(255,159,67,0.95) 100%)',
        color: '#000', fontWeight: 900, fontSize: '14px',
        padding: '10px 22px', borderRadius: '30px',
        boxShadow: '0 8px 32px rgba(254,205,8,0.6), inset 0 1px 2px rgba(255,255,255,0.4)',
        animation: 'toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), toastOut 0.5s ease-in 2.5s forwards',
        whiteSpace: 'nowrap', textShadow: '0 1px 1px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>🚀</span>
        <span>{t.name} cashed out @ {t.mult}x — won {t.won}!</span>
      </div>
    ))}
  </div>
);

// ─── Animated graph canvas ─────────────────────────────────────────────────────
const AviatorGraph = ({ multiplier, phase, planePos, setPlanePos }) => {
  const canvasRef = useRef(null);
  const pointsRef = useRef([{ t: 0, m: 1 }]);
  const startRef  = useRef(Date.now());
  const animRef   = useRef(null);

  useEffect(() => {
    if (phase === 'betting') {
      pointsRef.current = [{ t: 0, m: 1 }];
      startRef.current  = Date.now();
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'flying') {
      const elapsed = (Date.now() - startRef.current) / 1000;
      pointsRef.current.push({ t: elapsed, m: multiplier });
    }
  }, [multiplier, phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Grid lines (subtle scrolling effect)
      const tNow = Date.now() / 1000;
      const offset = (tNow * 20) % 100;
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      for (let x = -offset; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50)  { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Y-axis multiplier labels
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '10px monospace';
      [1.5, 2, 3, 5, 10].forEach(label => {
        const yPos = H - 25 - ((label - 1) / 9) * (H - 55);
        if (yPos > 5 && yPos < H - 5) {
          ctx.fillText(`${label}x`, 8, yPos + 4);
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 8]);
          ctx.beginPath(); ctx.moveTo(30, yPos); ctx.lineTo(W, yPos); ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      const pts = pointsRef.current;
      if (pts.length < 2) { animRef.current = requestAnimationFrame(draw); return; }

      const maxT = Math.max(pts[pts.length - 1].t, 5);
      const maxM = Math.max(pts[pts.length - 1].m * 1.15, 2);

      const scaleX = (t) => (t / maxT) * (W - 60) + 40;
      const scaleY = (m) => H - 25 - ((m - 1) / (maxM - 1 || 1)) * (H - 60);

      const crashed = phase === 'crashed';
      const lineColor = crashed ? '#dc3545' : multiplierToColor(multiplier);

      // Helper: draw smooth bezier path through points
      const drawBezier = () => {
        ctx.beginPath();
        ctx.moveTo(scaleX(pts[0].t), scaleY(pts[0].m));
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1], curr = pts[i];
          const cpX = (scaleX(prev.t) + scaleX(curr.t)) / 2;
          ctx.bezierCurveTo(cpX, scaleY(prev.m), cpX, scaleY(curr.m), scaleX(curr.t), scaleY(curr.m));
        }
      };

      // Outer glow
      drawBezier();
      ctx.strokeStyle = lineColor + '33';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner glow
      drawBezier();
      ctx.strokeStyle = lineColor + '66';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Gradient fill under bezier
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, lineColor + '33');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(scaleX(pts[0].t), H - 25);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1], curr = pts[i];
        const cpX = (scaleX(prev.t) + scaleX(curr.t)) / 2;
        ctx.bezierCurveTo(cpX, scaleY(prev.m), cpX, scaleY(curr.m), scaleX(curr.t), scaleY(curr.m));
      }
      ctx.lineTo(scaleX(pts[pts.length - 1].t), H - 25);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Main crisp bezier line
      drawBezier();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Report plane position for SVG overlay
      if (phase === 'flying' && pts.length >= 2 && setPlanePos) {
        const last = pts[pts.length - 1];
        const prev = pts[Math.max(0, pts.length - 3)];
        const px = scaleX(last.t);
        const py = scaleY(last.m);
        const dx = scaleX(last.t) - scaleX(prev.t);
        const dy = scaleY(last.m) - scaleY(prev.m);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const rect = canvas.getBoundingClientRect();
        const scaleW = rect.width / W;
        const scaleH = rect.height / H;
        setPlanePos({ x: px * scaleW - 18, y: py * scaleH - 18, angle });

        // Jet engine trail particles
        for (let i = 0; i < 12; i++) {
          const trailX = px - (i + 1) * 5;
          const spread = i * 1.2;
          const trailY = py + (Math.random() - 0.5) * spread;
          const alpha = Math.max(0, 0.7 - i * 0.06);
          ctx.beginPath();
          ctx.fillStyle = i < 3 ? '#fff' : (i < 6 ? '#fecd08' : lineColor);
          ctx.globalAlpha = alpha;
          ctx.arc(trailX, trailY, Math.max(0.5, 4 - i * 0.25), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, setPlanePos]);

  return (
    <canvas
      ref={canvasRef}
      width={860} height={320}
      style={{ width: '100%', height: '320px', display: 'block' }}
    />
  );
};

// ─── Stats bar for live panel ─────────────────────────────────────────────────
const StatsBar = ({ players, country }) => {
  const total   = players.length;
  const cashed  = players.filter(p => p.cashedAt).length;
  const pot     = players.reduce((s, p) => s + p.bet, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}>
      {[['Players', total], ['Cashed', cashed], ['Total Bet', `${country.symbol}${pot.toLocaleString()}`]].map(([label, val]) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{val}</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Live Bets Feed ────────────────────────────────────────────────────────────
const LiveBetsFeed = ({ multiplier, phase, onBigWin, country }) => {
  const [players, setPlayers] = useState(() => generatePlayers(22));

  useEffect(() => {
    if (phase === 'betting') setPlayers(generatePlayers(18 + Math.floor(Math.random() * 10)));
  }, [phase]);

  useEffect(() => {
    if (phase !== 'flying') return;
    const interval = setInterval(() => {
      setPlayers(prev => {
        const waiting = prev.filter(p => !p.cashedAt);
        if (!waiting.length) return prev;
        // Cash out 1-2 players per tick
        const count = Math.random() > 0.6 ? 2 : 1;
        let updated = [...prev];
        for (let c = 0; c < count; c++) {
          const still = updated.filter(p => !p.cashedAt);
          if (!still.length) break;
          const idx = Math.floor(Math.random() * still.length);
          const target = still[idx];
          updated = updated.map(p => p.id === target.id ? { ...p, cashedAt: multiplier, status: 'won' } : p);
          // Trigger big win toast if multiplier is notable
          if (multiplier >= 2.5 && onBigWin) {
            onBigWin({ name: target.name, mult: multiplier.toFixed(2), won: `${country.symbol}${(target.bet * multiplier).toFixed(0)}` });
          }
        }
        return updated;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [phase, multiplier]);

  useEffect(() => {
    if (phase === 'crashed') setPlayers(prev => prev.map(p => p.cashedAt ? p : { ...p, status: 'lost' }));
  }, [phase]);

  const sorted = [...players].sort((a, b) => {
    if (a.cashedAt && !b.cashedAt) return -1;
    if (!a.cashedAt && b.cashedAt) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <StatsBar players={players} country={country} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', padding: '6px 10px 4px', fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '4px' }}>
        <span>Player</span><span style={{ textAlign: 'right' }}>Bet</span>
        <span style={{ textAlign: 'right' }}>@ x</span>
        <span style={{ textAlign: 'right' }}>Win</span>
      </div>
      {sorted.slice(0, 14).map(p => {
        const won  = !!p.cashedAt;
        const lost = p.status === 'lost' && !p.cashedAt;
        return (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr',
            padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
            background: won ? 'rgba(134,196,57,0.08)' : lost ? 'rgba(220,53,69,0.04)' : 'transparent',
            transition: 'background 0.4s',
          }}>
            <span style={{ color: won ? '#86c439' : lost ? 'rgba(255,255,255,0.25)' : '#fff', fontWeight: won ? 700 : 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {won && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#86c439', flexShrink: 0, boxShadow: '0 0 4px #86c439' }} />}
              {p.name}
            </span>
            <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{country.symbol}{p.bet}</span>
            <span style={{ textAlign: 'right', fontWeight: 700, color: won ? '#86c439' : lost ? '#dc3545' : 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
              {won ? `${p.cashedAt.toFixed(2)}x` : lost ? 'x' : '…'}
            </span>
            <span style={{ textAlign: 'right', fontWeight: won ? 800 : 400, color: won ? '#86c439' : lost ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
              {won ? `${country.symbol}${(p.bet * p.cashedAt).toFixed(0)}` : lost ? '—' : '…'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Provably Fair modal ───────────────────────────────────────────────────────
const ProvablyFairModal = ({ onClose }) => {
  const [serverHash]  = useState(() => randomHash() + randomHash() + randomHash() + randomHash());
  const [clientSeed, setClientSeed] = useState(() => randomHash());
  const [verified, setVerified]   = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '1rem' }}>
      <div style={{ background: '#0d1923', border: '1px solid rgba(134,196,57,0.25)', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(134,196,57,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>🔒 Provably Fair</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: 1.7, marginBottom: '1.25rem' }}>Each round's outcome is determined by SHA-256(serverSeed + clientSeed + nonce). You can verify every result independently.</p>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>Server Hash (SHA-256)</label>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', background: 'rgba(134,196,57,0.06)', padding: '10px 12px', borderRadius: '6px', color: '#86c439', wordBreak: 'break-all', border: '1px solid rgba(134,196,57,0.15)' }}>{serverHash}</div>
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>Client Seed (editable)</label>
          <input value={clientSeed} onChange={e => { setClientSeed(e.target.value); setVerified(false); }}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '6px', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {verified && (
          <div style={{ background: 'rgba(134,196,57,0.1)', border: '1px solid rgba(134,196,57,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '1rem', color: '#86c439', fontSize: '13px', textAlign: 'center', fontWeight: 700 }}>
            ✅ Round verified — outcome is provably fair!
          </div>
        )}
        <button onClick={() => setVerified(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #86c439, #5a9e27)', color: '#000', border: 'none', padding: '13px', borderRadius: '8px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
          Verify Round
        </button>
      </div>
    </div>
  );
};

// ─── Countdown ring ────────────────────────────────────────────────────────────
const CountdownRing = ({ countdown, max = 10 }) => {
  const pct = countdown / max;
  const R = 38, circ = 2 * Math.PI * R;
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="120" height="120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="60" cy="60" r={R} fill="none" stroke="#fecd08" strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s linear', filter: 'drop-shadow(0 0 6px rgba(254,205,8,0.8))' }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '30px', fontWeight: 900, color: '#fecd08', lineHeight: 1 }}>{countdown}</div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>SEC</div>
      </div>
    </div>
  );
};

// ─── Bet Slot (Manual / Auto tabs) ───────────────────────────────────────────
const BetSlot = ({ socket, phase, multiplier, label, country }) => {
  const [mode,        setMode]        = useState('manual');
  const [stake,       setStake]       = useState(50);
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [betPlaced,   setBetPlaced]   = useState(false);
  const [cashedOut,   setCashedOut]   = useState(null);
  const [msg,         setMsg]         = useState(null); // {text, color}

  const flash = (text, color = '#86c439', ms = 3500) => {
    setMsg({ text, color });
    setTimeout(() => setMsg(null), ms);
  };

  useEffect(() => {
    if (!socket) return;
    const onState     = ({ phase: p }) => { if (p === 'betting') { setBetPlaced(false); setCashedOut(null); } };
    const onCashedOut = ({ multiplier: m, winnings, auto }) => {
      setCashedOut({ multiplier: m, winnings });
      flash(`${auto ? '🤖 Auto' : '✋ Manual'} cashout @ ${m}x → ${country.symbol}${winnings}`, '#fecd08', 4000);
    };
    const onError  = ({ message: e }) => flash(`❌ ${e}`, '#dc3545');
    socket.on('aviator_state',     onState);
    socket.on('aviator_cashed_out', onCashedOut);
    socket.on('aviator_error',     onError);
    return () => {
      socket.off('aviator_state',     onState);
      socket.off('aviator_cashed_out', onCashedOut);
      socket.off('aviator_error',     onError);
    };
  }, [socket]);

  const handleBet = () => {
    if (!socket || phase !== 'betting') return;
    const ac = mode === 'auto' && autoCashout ? parseFloat(autoCashout) : null;
    socket.emit('aviator_place_bet', { stake: parseFloat(stake), autoCashout: ac });
    setBetPlaced(true);
    flash('✅ Bet confirmed!', '#86c439');
  };
  const handleCashout = () => {
    if (!socket || phase !== 'flying' || !betPlaced || cashedOut) return;
    socket.emit('aviator_cashout');
  };

  const canBet     = phase === 'betting' && !betPlaced;
  const canCashout = phase === 'flying' && betPlaced && !cashedOut;

  return (
    <div style={{ background: 'rgba(20, 30, 42, 0.65)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '1rem 1.1rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle at 50% 120%, ${phase === 'betting' ? 'rgba(134,196,57,0.05)' : 'transparent'} 0%, transparent 50%)`, pointerEvents: 'none' }} />
      {/* Label + tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>{label}</span>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '2px', gap: '2px' }}>
          {['manual', 'auto'].map(m => (
            <button key={m} onClick={() => !betPlaced && setMode(m)} style={{
              padding: '4px 12px', borderRadius: '5px', border: 'none', cursor: betPlaced ? 'not-allowed' : 'pointer',
              background: mode === m ? 'rgba(134,196,57,0.2)' : 'transparent',
              color: mode === m ? '#86c439' : 'rgba(255,255,255,0.3)',
              fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s',
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Flash msg */}
      {msg && (
        <div style={{ fontSize: '12px', fontWeight: 700, color: msg.color, marginBottom: '0.6rem', background: msg.color + '18', padding: '6px 10px', borderRadius: '6px', textAlign: 'center', border: `1px solid ${msg.color}33` }}>{msg.text}</div>
      )}

      {/* Stake input */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{country.symbol}</span>
          <input type="number" value={stake} onChange={e => setStake(e.target.value)} disabled={betPlaced}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '9px 10px 9px 28px', borderRadius: '7px', outline: 'none', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }} />
        </div>
        {[50, 200, 500].map(v => (
          <button key={v} onClick={() => !betPlaced && setStake(v)} disabled={betPlaced}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: stake == v ? '#86c439' : 'rgba(255,255,255,0.4)', padding: '6px 8px', borderRadius: '6px', cursor: betPlaced ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 700, minWidth: '36px', transition: 'color 0.2s' }}>
            {v}
          </button>
        ))}
      </div>

      {/* Auto cashout (only in auto mode) */}
      {mode === 'auto' && (
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>AUTO CASH-OUT AT</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="number" step="0.1" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} disabled={betPlaced}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fecd08', fontWeight: 700, padding: '8px 10px', borderRadius: '7px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 700 }}>×</span>
          </div>
        </div>
      )}

      {/* Potential win preview */}
      {betPlaced && !cashedOut && phase === 'flying' && (
        <div style={{ textAlign: 'center', marginBottom: '8px', padding: '8px', background: 'rgba(134,196,57,0.08)', borderRadius: '8px', border: '1px solid rgba(134,196,57,0.15)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>IF CASHED NOW</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#86c439', textShadow: '0 0 10px rgba(134,196,57,0.5)' }}>
            {country.symbol}{(stake * multiplier).toFixed(2)}
          </div>
        </div>
      )}
      {cashedOut && (
        <div style={{ textAlign: 'center', marginBottom: '8px', padding: '8px', background: 'rgba(254,205,8,0.08)', borderRadius: '8px', border: '1px solid rgba(254,205,8,0.2)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>CASHED @ {cashedOut.multiplier}x</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fecd08' }}>{country.symbol}{cashedOut.winnings}</div>
        </div>
      )}

      {/* Action Button */}
      {canBet && (
        <button onClick={handleBet} style={{ width: '100%', background: 'linear-gradient(135deg, #9ae640, #5a9e27)', color: '#000', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 6px 20px rgba(134,196,57,0.4), inset 0 1px 1px rgba(255,255,255,0.4)', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(134,196,57,0.6), inset 0 1px 1px rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(134,196,57,0.4), inset 0 1px 1px rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(134,196,57,0.4)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        >
          BET <span style={{ fontSize: '16px' }}>{country.symbol}{stake}</span>
        </button>
      )}
      {betPlaced && phase === 'betting' && (
        <div style={{ width: '100%', background: 'rgba(134,196,57,0.08)', border: '1px dashed rgba(134,196,57,0.3)', color: '#86c439', padding: '13px', borderRadius: '9px', fontSize: '13px', textAlign: 'center', fontWeight: 700 }}>
          ✈️ Waiting for takeoff…
        </div>
      )}
      {canCashout && (
        <button onClick={handleCashout} style={{ width: '100%', background: 'linear-gradient(135deg, #ffd933, #e6b800)', color: '#000', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 6px 30px rgba(254,205,8,0.7), inset 0 1px 1px rgba(255,255,255,0.5)', animation: 'pulseCashout 0.6s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate', letterSpacing: '0.5px', transition: 'transform 0.1s' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
        >
          💰 CASH OUT @ {multiplier.toFixed(2)}x
        </button>
      )}
      {!canBet && !canCashout && !betPlaced && phase !== 'betting' && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', padding: '13px', borderRadius: '9px', background: 'rgba(255,255,255,0.02)' }}>
          {phase === 'crashed' ? '⏳ Next round starting…' : 'Place your bet!'}
        </div>
      )}
    </div>
  );
};

// ─── Main Aviator component ───────────────────────────────────────────────────
const AviatorGame = () => {
  const { socket, connected } = useSocket();
  const { country } = useUser();
  const { stats, record } = useSessionStats();

  const [phase,      setPhase]      = useState('betting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown,  setCountdown]  = useState(5);
  const [crashAt,    setCrashAt]    = useState(null);
  const [history,    setHistory]    = useState([2.14, 1.03, 5.70, 1.22, 3.45, 1.01, 8.20, 1.55]);
  const [showFair,   setShowFair]   = useState(false);
  const [activeTab,  setActiveTab]  = useState('live');
  const [planePos,   setPlanePos]   = useState(null);
  const [toasts,     setToasts]     = useState([]);
  const [reactions,  setReactions]  = useState([]);
  const [flashRed,   setFlashRed]   = useState(false);
  const toastId   = useRef(0);
  const reactId   = useRef(0);

  const addReaction = useCallback((emoji) => {
    const id = reactId.current++;
    const x = 10 + Math.random() * 80;
    setReactions(prev => [...prev.slice(-6), { id, emoji, x }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2600);
  }, []);

  const addToast = useCallback((toast) => {
    const id = toastId.current++;
    setToasts(prev => [...prev.slice(-2), { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onState     = ({ phase: p, multiplier: m, countdown: c, history: h }) => {
      setPhase(p); setMultiplier(m ?? 1); setCountdown(c ?? 5); setHistory(h ?? []);
      if (p === 'betting') { setPlanePos(null); }
    };
    const onTick      = ({ multiplier: m }) => setMultiplier(m);
    const onCountdown = ({ countdown: c }) => setCountdown(c);
    const onCrashed   = ({ crashAt: ca, history: h }) => {
      setCrashAt(ca); setHistory(h); setPhase('crashed'); setPlanePos(null);
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 800);
      if (ca >= 10) addReaction('🏆');
      else if (ca >= 5) addReaction('🚀');
      else if (ca >= 2) addReaction('🔥');
    };
    socket.on('aviator_state',     onState);
    socket.on('aviator_tick',      onTick);
    socket.on('aviator_countdown', onCountdown);
    socket.on('aviator_crashed',   onCrashed);
    return () => {
      socket.off('aviator_state', onState); socket.off('aviator_tick', onTick);
      socket.off('aviator_countdown', onCountdown); socket.off('aviator_crashed', onCrashed);
    };
  }, [socket]);

  const multColor = phase === 'crashed' ? '#dc3545' : multiplierToColor(multiplier);
  const multGlow  = `0 0 40px ${multColor}88, 0 0 80px ${multColor}33`;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '1120px', margin: '0 auto', userSelect: 'none' }}>

      {/* History row + session stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginRight: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>HISTORY</span>
          {history.slice(-14).map((v, i) => (
            <span key={i} style={{
              background: crashColour(v) + '1a', color: crashColour(v),
              fontWeight: 700, fontSize: '11px', padding: '3px 10px',
              borderRadius: '20px', border: `1px solid ${crashColour(v)}44`, cursor: 'default',
            }}>
              {v.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Session mini-stats */}
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          {[['Rounds', stats.rounds], ['Wins', stats.won], ['Best', stats.bigWin ? `${country.symbol}${stats.bigWin}` : '—']].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: label === 'Wins' && stats.won > 0 ? '#86c439' : '#fff' }}>{val}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid: canvas + live bets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '0.75rem', marginBottom: '0.75rem' }}>

        {/* ── Canvas panel ──────────────────── */}
        <div style={{ position: 'relative', background: 'radial-gradient(circle at 30% 90%, rgba(134,196,57,0.05) 0%, transparent 60%), radial-gradient(ellipse at 15% 85%, #0a1a28 0%, #04080e 100%)', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${flashRed ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.08)'}`, transition: 'border-color 0.3s', boxShadow: flashRed ? '0 0 40px rgba(220,53,69,0.5)' : '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          {/* Red flash overlay on crash */}
          {flashRed && <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,53,69,0.12)', zIndex: 5, pointerEvents: 'none', animation: 'fadeFlash 0.8s ease-out forwards' }} />}

          <Stars crashed={phase === 'crashed'} phase={phase} />
          <AviatorGraph multiplier={multiplier} phase={phase} planePos={planePos} setPlanePos={setPlanePos} />
          <FloatingReactions reactions={reactions} />

          {/* SVG Plane overlay */}
          {phase === 'flying' && planePos && (
            <div style={{ position: 'absolute', left: `${planePos.x}px`, top: `${planePos.y}px`, transform: `rotate(${planePos.angle}deg)`, transformOrigin: 'center', pointerEvents: 'none', transition: 'left 0.08s linear, top 0.08s linear' }}>
              <PlaneSVG color={multColor} size={36} />
            </div>
          )}

          {/* Pulse rings around multiplier while flying */}
          {phase === 'flying' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
              <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: `2px solid ${multColor}33`, animation: 'pulseRing 1.5s ease-out infinite', position: 'absolute' }} />
              <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: `1px solid ${multColor}1a`, animation: 'pulseRing 1.5s ease-out 0.5s infinite', position: 'absolute' }} />
            </div>
          )}

          {/* Big win toasts */}
          <BigWinToast toasts={toasts} />

          {/* Center overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {phase === 'betting' && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '3px', fontWeight: 700 }}>NEXT ROUND IN</div>
                <CountdownRing countdown={countdown} max={10} />
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>Bets are closed</div>
              </div>
            )}
            {phase === 'flying' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '4px', marginBottom: '4px', fontWeight: 700 }}>FLYING AWAY</div>
                <div style={{ fontSize: '104px', fontWeight: 900, color: '#fff', textShadow: `0 0 20px ${multColor}, 0 0 40px ${multColor}, 0 0 80px ${multColor}`, lineHeight: 1, transition: 'color 0.2s, text-shadow 0.2s', fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px' }}>
                  {multiplier.toFixed(2)}<span style={{ fontSize: '48px', color: multColor, marginLeft: '4px' }}>×</span>
                </div>
              </div>
            )}
            {phase === 'crashed' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#ff4757', fontWeight: 900, letterSpacing: '6px', marginBottom: '4px', animation: 'flickerRed 0.15s infinite alternate' }}>FLEW AWAY!</div>
                <div style={{ fontSize: '92px', fontWeight: 900, color: '#fff', textShadow: '0 0 20px #ff4757, 0 0 50px #ff4757, 0 0 80px #ff4757', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px' }}>
                  {crashAt?.toFixed(2)}<span style={{ fontSize: '44px', color: '#ff4757', marginLeft: '4px' }}>×</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button onClick={() => setShowFair(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#86c439'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
              🔒 Provably Fair
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: connected ? '#86c439' : '#dc3545' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: connected ? '#86c439' : '#dc3545', animation: 'pulse 2s infinite', display: 'inline-block', boxShadow: connected ? '0 0 4px #86c439' : '0 0 4px #dc3545' }} />
              {connected ? 'Live' : 'Connecting…'}
            </div>
          </div>
        </div>

        {/* ── Live bets panel ───────────────── */}
        <div style={{ background: 'rgba(11, 20, 31, 0.8)', backdropFilter: 'blur(8px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[['live', 'All Bets'], ['top', 'Top Wins'], ['my', 'My Bets']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, padding: '11px 4px', border: 'none', cursor: 'pointer', background: activeTab === key ? 'rgba(134,196,57,0.06)' : 'transparent', color: activeTab === key ? '#86c439' : 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', borderBottom: activeTab === key ? '2px solid #86c439' : '2px solid transparent', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {activeTab === 'live' && <LiveBetsFeed multiplier={multiplier} phase={phase} onBigWin={addToast} country={country} />}
            {activeTab === 'top' && (
              <div style={{ padding: '8px 0' }}>
                {history.slice().sort((a,b) => b - a).slice(0,8).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: '5px', background: i === 0 ? 'rgba(254,205,8,0.06)' : 'transparent' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>#{i+1}</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: crashColour(v) }}>{v.toFixed(2)}x</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{i === 0 ? '👑' : ''}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'my' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'rgba(255,255,255,0.2)', fontSize: '12px', textAlign: 'center', gap: '8px' }}>
                <div style={{ fontSize: '32px' }}>✈️</div>
                Place a bet to track it here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Bet Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <BetSlot socket={socket} phase={phase} multiplier={multiplier} label="Bet 1" country={country} />
        <BetSlot socket={socket} phase={phase} multiplier={multiplier} label="Bet 2" country={country} />
      </div>

      {showFair && <ProvablyFairModal onClose={() => setShowFair(false)} />}

      <style>{`
        @keyframes pulseCashout {
          from { transform: scale(1);    box-shadow: 0 4px 20px rgba(254,205,8,0.5); }
          to   { transform: scale(1.03); box-shadow: 0 6px 35px rgba(254,205,8,0.9); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.4);  opacity: 0; }
        }
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.4); }
        }
        @keyframes fadeFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes twinkle    { from{opacity:0.1} to{opacity:0.9} }
        @keyframes flickerRed { from{opacity:1} to{opacity:0.6} }
        @keyframes toastIn    { from{opacity:0; transform:translateX(-50%) translateY(-12px)} to{opacity:1; transform:translateX(-50%) translateY(0)} }
        @keyframes toastOut   { from{opacity:1} to{opacity:0; transform:translateX(-50%) translateY(-10px)} }
      `}</style>
    </div>
  );
};

export default AviatorGame;

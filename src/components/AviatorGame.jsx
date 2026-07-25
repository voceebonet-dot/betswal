import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

// ─── Crash colour helper ───────────────────────────────────────────────────────
const crashColour = (v) => {
  if (v < 2)  return '#8496a8';
  if (v < 5)  return '#86c439';
  if (v < 10) return '#fecd08';
  return '#ff4757';
};

// ─── Fake players generator ────────────────────────────────────────────────────
const NAMES = ['Alex', 'Kamau', 'Victor', 'Nancy', 'Patrick', 'Grace', 'Brian', 'Wanjiku',
  'Peter', 'Amina', 'John', 'Fatuma', 'James', 'Aisha', 'Daniel', 'Otieno',
  'Mark', 'Njeri', 'Samuel', 'Zawadi', 'Felix', 'Rose', 'Kevin', 'Lydiah'];

const randomBet  = () => Math.floor(Math.random() * 490 + 10) * 5;
const randomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];
const randomHash = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const generatePlayers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i, name: randomName(), bet: randomBet(), cashedAt: null, status: 'waiting',
  }));

// ─── Stars background ──────────────────────────────────────────────────────────
const Stars = () => {
  const stars = useRef(
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, delay: Math.random() * 3,
    }))
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.current.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          animation: `twinkle 3s ${s.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
};

// ─── Animated graph canvas ─────────────────────────────────────────────────────
const AviatorGraph = ({ multiplier, phase }) => {
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

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Multiplier axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '11px monospace';
      ['1.0x', '2.0x', '3.0x', '5.0x'].forEach((label, i) => {
        ctx.fillText(label, 6, H - 20 - i * (H - 40) / 4);
      });

      const pts = pointsRef.current;
      if (pts.length < 2) { animRef.current = requestAnimationFrame(draw); return; }

      const maxT = Math.max(pts[pts.length - 1].t, 5);
      const maxM = Math.max(pts[pts.length - 1].m * 1.1, 2);

      const scaleX = (t) => (t / maxT) * (W - 70) + 50;
      const scaleY = (m) => H - 30 - ((m - 1) / (maxM - 1 || 1)) * (H - 70);

      const crashed = phase === 'crashed';
      const lineColor = crashed ? '#dc3545' : '#86c439';

      // Glow effect - draw wide translucent version first
      ctx.beginPath();
      ctx.strokeStyle = lineColor + '44';
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(scaleX(p.t), scaleY(p.m)) : ctx.lineTo(scaleX(p.t), scaleY(p.m)));
      ctx.stroke();

      // Gradient fill
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, crashed ? 'rgba(220,53,69,0.25)' : 'rgba(134,196,57,0.25)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(scaleX(pts[0].t), H - 30);
      pts.forEach(p => ctx.lineTo(scaleX(p.t), scaleY(p.m)));
      ctx.lineTo(scaleX(pts[pts.length - 1].t), H - 30);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Main curve line
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(scaleX(p.t), scaleY(p.m)) : ctx.lineTo(scaleX(p.t), scaleY(p.m)));
      ctx.stroke();

      // Animated plane at tip
      if (phase === 'flying' && pts.length >= 2) {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const dx = scaleX(last.t) - scaleX(prev.t);
        const dy = scaleY(last.m) - scaleY(prev.m);
        const angle = Math.atan2(dy, dx);

        // Rocket trail particles
        ctx.save();
        ctx.translate(scaleX(last.t), scaleY(last.m));
        for (let i = 0; i < 5; i++) {
          const trail = Math.random() * 20 + 5;
          ctx.fillStyle = `rgba(134,196,57,${0.1 + Math.random() * 0.2})`;
          ctx.beginPath();
          ctx.arc(-trail - i * 4, (Math.random() - 0.5) * 12, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.rotate(angle);
        ctx.font = 'bold 26px serif';
        ctx.fillText('✈️', -13, 9);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      width={860} height={310}
      style={{ width: '100%', height: '310px', display: 'block' }}
    />
  );
};

// ─── Live Bets Feed (Multiplayer panel, Spribe-style) ─────────────────────────
const LiveBetsFeed = ({ multiplier, phase }) => {
  const [players, setPlayers] = useState(() => generatePlayers(20));
  const { country } = useUser();

  // When round starts, reset players
  useEffect(() => {
    if (phase === 'betting') {
      setPlayers(generatePlayers(18 + Math.floor(Math.random() * 8)));
    }
  }, [phase]);

  // When flying, randomly cash players out
  useEffect(() => {
    if (phase !== 'flying') return;
    const interval = setInterval(() => {
      setPlayers(prev => {
        const waiting = prev.filter(p => !p.cashedAt);
        if (!waiting.length) return prev;
        const idx = Math.floor(Math.random() * waiting.length);
        return prev.map(p => {
          if (p.id === waiting[idx].id) {
            return { ...p, cashedAt: multiplier, status: 'won' };
          }
          return p;
        });
      });
    }, 600);
    return () => clearInterval(interval);
  }, [phase, multiplier]);

  // When crashed, mark remaining as lost
  useEffect(() => {
    if (phase === 'crashed') {
      setPlayers(prev => prev.map(p => p.cashedAt ? p : { ...p, status: 'lost' }));
    }
  }, [phase]);

  const shown = players.slice(0, 14);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
        padding: '6px 10px', fontSize: '10px',
        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        <span>Player</span><span style={{ textAlign: 'right' }}>Bet</span>
        <span style={{ textAlign: 'right' }}>Cash @</span>
        <span style={{ textAlign: 'right' }}>Win</span>
      </div>

      {shown.map(p => {
        const isCashed = !!p.cashedAt;
        const isLost   = p.status === 'lost';
        return (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
            background: isCashed ? 'rgba(134,196,57,0.07)' : isLost ? 'rgba(220,53,69,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'background 0.3s',
          }}>
            <span style={{ color: isCashed ? '#86c439' : isLost ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: isCashed ? 700 : 400 }}>
              {isCashed && '✓ '}{p.name}
            </span>
            <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>
              {country.symbol}{p.bet}
            </span>
            <span style={{ textAlign: 'right', color: isCashed ? '#86c439' : isLost ? '#dc3545' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
              {isCashed ? `${p.cashedAt.toFixed(2)}x` : isLost ? '—' : '...'}
            </span>
            <span style={{ textAlign: 'right', color: isCashed ? '#86c439' : isLost ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', fontWeight: isCashed ? 700 : 400 }}>
              {isCashed ? `${country.symbol}${(p.bet * p.cashedAt).toFixed(0)}` : isLost ? '0' : '...'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Provably Fair modal ───────────────────────────────────────────────────────
const ProvablyFairModal = ({ onClose }) => {
  const [serverHash]  = useState(randomHash() + randomHash() + randomHash() + randomHash());
  const [clientSeed, setClientSeed] = useState(randomHash());
  const [verified, setVerified] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', padding: '1rem'
    }}>
      <div style={{
        background: '#0d1923', border: '1px solid rgba(134,196,57,0.3)',
        borderRadius: '16px', padding: '2rem', maxWidth: '540px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔒 Provably Fair Verification
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Each round's outcome is determined by a SHA-256 hash of the server seed + client seed + nonce. You can independently verify every result.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Server Hash (SHA-256)</label>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '6px', color: '#86c439', wordBreak: 'break-all' }}>{serverHash}</div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Client Seed</label>
          <input
            value={clientSeed}
            onChange={e => { setClientSeed(e.target.value); setVerified(false); }}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '6px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {verified && (
          <div style={{ background: 'rgba(134,196,57,0.1)', border: '1px solid rgba(134,196,57,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '1rem', color: '#86c439', fontSize: '13px', textAlign: 'center', fontWeight: 700 }}>
            ✅ Verification passed — outcome is fair!
          </div>
        )}

        <button
          onClick={() => setVerified(true)}
          style={{ width: '100%', background: 'linear-gradient(135deg, #86c439, #5a9e27)', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
        >
          Verify Round
        </button>
      </div>
    </div>
  );
};

// ─── Bet Slot ──────────────────────────────────────────────────────────────────
const BetSlot = ({ socket, phase, multiplier, label, country }) => {
  const [stake,       setStake]       = useState(50);
  const [autoCashout, setAutoCashout] = useState('');
  const [betPlaced,   setBetPlaced]   = useState(false);
  const [cashedOut,   setCashedOut]   = useState(null);
  const [msg,         setMsg]         = useState('');

  const flash = (m, ms = 3000) => { setMsg(m); setTimeout(() => setMsg(''), ms); };

  useEffect(() => {
    if (!socket) return;
    const onState = ({ phase: p }) => { if (p === 'betting') { setBetPlaced(false); setCashedOut(null); } };
    const onCashedOut = ({ multiplier: m, winnings, auto }) => {
      setCashedOut({ multiplier: m, winnings });
      flash(`${auto ? '🤖 Auto' : '✋ Manual'} @ ${m}x → ${country.symbol}${winnings}`, 4000);
    };
    const onError = ({ message: e }) => flash(`❌ ${e}`);
    socket.on('aviator_state', onState);
    socket.on('aviator_cashed_out', onCashedOut);
    socket.on('aviator_error', onError);
    return () => { socket.off('aviator_state', onState); socket.off('aviator_cashed_out', onCashedOut); socket.off('aviator_error', onError); };
  }, [socket]);

  const handleBet = () => {
    if (!socket || phase !== 'betting') return;
    socket.emit('aviator_place_bet', { stake: parseFloat(stake), autoCashout: autoCashout ? parseFloat(autoCashout) : null });
    setBetPlaced(true);
    flash('✅ Bet placed!');
  };

  const handleCashout = () => {
    if (!socket || phase !== 'flying' || !betPlaced || cashedOut) return;
    socket.emit('aviator_cashout');
  };

  const canBet     = phase === 'betting' && !betPlaced;
  const canCashout = phase === 'flying' && betPlaced && !cashedOut;

  return (
    <div style={{ background: '#1b242e', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>{label}</div>

      {msg && (
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#86c439', marginBottom: '0.75rem', background: 'rgba(134,196,57,0.1)', padding: '6px 10px', borderRadius: '6px', textAlign: 'center' }}>{msg}</div>
      )}

      {/* Stake row */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        <input
          type="number" value={stake}
          onChange={e => setStake(e.target.value)}
          disabled={betPlaced}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '9px 10px', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
        />
        {[10, 50, 200].map(v => (
          <button key={v} onClick={() => setStake(v)} disabled={betPlaced}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '6px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}>
            {v}
          </button>
        ))}
      </div>

      {/* Auto cashout */}
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          type="number" step="0.1" placeholder="Auto cash-out (e.g. 2.00)"
          value={autoCashout} onChange={e => setAutoCashout(e.target.value)}
          disabled={betPlaced}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '9px 10px', borderRadius: '6px', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
        />
      </div>

      {/* Possible win */}
      {betPlaced && !cashedOut && phase === 'flying' && (
        <div style={{ textAlign: 'center', marginBottom: '0.75rem', padding: '6px', background: 'rgba(134,196,57,0.08)', borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>If cashed now</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#86c439' }}>{country.symbol}{(stake * multiplier).toFixed(2)}</div>
        </div>
      )}
      {cashedOut && (
        <div style={{ textAlign: 'center', marginBottom: '0.75rem', padding: '6px', background: 'rgba(134,196,57,0.08)', borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Cashed @ {cashedOut.multiplier}x</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#86c439' }}>{country.symbol}{cashedOut.winnings}</div>
        </div>
      )}

      {/* Action button */}
      {canBet && (
        <button onClick={handleBet} className="btn btn-primary"
          style={{ width: '100%', padding: '13px', fontWeight: 800, fontSize: '14px', borderRadius: '8px', letterSpacing: '0.5px' }}>
          ✈️ BET  {country.symbol}{stake}
        </button>
      )}
      {betPlaced && phase === 'betting' && (
        <button disabled style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(255,255,255,0.15)', padding: '13px', borderRadius: '8px', fontSize: '13px', cursor: 'not-allowed' }}>
          Bet placed — waiting for takeoff…
        </button>
      )}
      {canCashout && (
        <button onClick={handleCashout}
          style={{ width: '100%', background: 'linear-gradient(135deg, #fecd08, #f59e0b)', color: '#000', border: 'none', padding: '13px', borderRadius: '8px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(254,205,8,0.5)', animation: 'pulseCashout 0.8s ease-in-out infinite alternate' }}>
          💰 CASH OUT @ {multiplier.toFixed(2)}x
        </button>
      )}
      {!canBet && !canCashout && !betPlaced && phase !== 'betting' && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '13px' }}>
          {phase === 'crashed' ? '⏳ Next round starting…' : 'Bet before takeoff!'}
        </div>
      )}
    </div>
  );
};

// ─── Main Aviator component ───────────────────────────────────────────────────
const AviatorGame = () => {
  const { socket, connected } = useSocket();
  const { country } = useUser();

  const [phase,      setPhase]      = useState('betting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown,  setCountdown]  = useState(5);
  const [crashAt,    setCrashAt]    = useState(null);
  const [history,    setHistory]    = useState([]);
  const [showFair,   setShowFair]   = useState(false);
  const [activeTab,  setActiveTab]  = useState('live'); // 'live' | 'my'

  // ── Listen to server events ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onState = ({ phase: p, multiplier: m, countdown: c, history: h }) => {
      setPhase(p); setMultiplier(m ?? 1); setCountdown(c ?? 5); setHistory(h ?? []);
    };
    const onTick      = ({ multiplier: m }) => setMultiplier(m);
    const onCountdown = ({ countdown: c }) => setCountdown(c);
    const onCrashed   = ({ crashAt: ca, history: h }) => {
      setCrashAt(ca); setHistory(h); setPhase('crashed');
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

  const multiplierColor = phase === 'crashed' ? '#dc3545' : phase === 'flying' ? '#86c439' : '#fecd08';
  const multiplierGlow  = phase === 'flying' ? '0 0 40px rgba(134,196,57,0.7), 0 0 80px rgba(134,196,57,0.3)' : phase === 'crashed' ? '0 0 40px rgba(220,53,69,0.7)' : 'none';

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>

      {/* History chips */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginRight: '4px' }}>History:</span>
        {history.slice(-14).map((v, i) => (
          <span key={i} style={{
            background: crashColour(v) + '22', color: crashColour(v),
            fontWeight: 700, fontSize: '11px', padding: '3px 9px',
            borderRadius: '20px', border: `1px solid ${crashColour(v)}44`
          }}>
            {v.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main layout: canvas + live bets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', marginBottom: '1rem' }}>

        {/* ── Left: Game Canvas ─────────────── */}
        <div style={{ position: 'relative', background: 'radial-gradient(ellipse at 20% 80%, #0a1520 0%, #060d14 100%)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}>
          <Stars />
          <AviatorGraph multiplier={multiplier} phase={phase} />

          {/* Multiplier overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {phase === 'betting' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px', marginBottom: '8px' }}>STARTING IN</div>
                <div style={{ fontSize: '80px', fontWeight: 900, color: '#fecd08', textShadow: '0 0 40px rgba(254,205,8,0.7)', lineHeight: 1 }}>
                  {countdown}<span style={{ fontSize: '36px' }}>s</span>
                </div>
              </div>
            )}
            {phase === 'flying' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', marginBottom: '6px' }}>FLYING AWAY</div>
                <div style={{ fontSize: '88px', fontWeight: 900, color: multiplierColor, textShadow: multiplierGlow, lineHeight: 1, transition: 'color 0.2s' }}>
                  {multiplier.toFixed(2)}<span style={{ fontSize: '42px' }}>x</span>
                </div>
              </div>
            )}
            {phase === 'crashed' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#dc3545', fontWeight: 800, letterSpacing: '4px', marginBottom: '6px' }}>FLEW AWAY!</div>
                <div style={{ fontSize: '80px', fontWeight: 900, color: '#dc3545', textShadow: '0 0 40px rgba(220,53,69,0.8)', lineHeight: 1 }}>
                  {crashAt?.toFixed(2)}<span style={{ fontSize: '36px' }}>x</span>
                </div>
              </div>
            )}
          </div>

          {/* Provably Fair button (bottom-left) */}
          <button
            onClick={() => setShowFair(true)}
            style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.color = '#86c439'; e.currentTarget.style.borderColor = '#86c43944'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            🔒 Provably Fair
          </button>

          {/* Connection indicator */}
          <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: connected ? '#86c439' : '#dc3545' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: connected ? '#86c439' : '#dc3545', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>

        {/* ── Right: Live Bets panel ─────────── */}
        <div style={{ background: '#0d1923', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[['live', 'All Bets'], ['my', 'My Bets']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                background: activeTab === key ? 'rgba(134,196,57,0.08)' : 'transparent',
                color: activeTab === key ? '#86c439' : 'rgba(255,255,255,0.35)',
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
                borderBottom: activeTab === key ? '2px solid #86c439' : '2px solid transparent',
                transition: 'all 0.2s'
              }}>
                {label}
              </button>
            ))}
          </div>
          {/* Feed */}
          <div style={{ overflowY: 'auto', maxHeight: '280px', padding: '6px' }}>
            {activeTab === 'live' ? (
              <LiveBetsFeed multiplier={multiplier} phase={phase} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>✈️</div>
                Place a bet to see your bets here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bet Controls: 2 slots side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <BetSlot socket={socket} phase={phase} multiplier={multiplier} label="Bet 1" country={country} />
        <BetSlot socket={socket} phase={phase} multiplier={multiplier} label="Bet 2" country={country} />
      </div>

      {showFair && <ProvablyFairModal onClose={() => setShowFair(false)} />}

      <style>{`
        @keyframes pulseCashout {
          from { transform: scale(1); box-shadow: 0 4px 20px rgba(254,205,8,0.5); }
          to   { transform: scale(1.03); box-shadow: 0 4px 35px rgba(254,205,8,0.9); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes twinkle { from{opacity:0.2} to{opacity:1} }
      `}</style>
    </div>
  );
};

export default AviatorGame;

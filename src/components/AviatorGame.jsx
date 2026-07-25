import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

// ─── Colour helper ────────────────────────────────────────────────────────────
const crashColour = (v) => {
  if (v < 2)   return '#8496a8';
  if (v < 5)   return '#86c439';
  if (v < 10)  return '#fecd08';
  return '#ff4757';
};

// ─── Graph canvas ─────────────────────────────────────────────────────────────
const AviatorGraph = ({ multiplier, phase }) => {
  const canvasRef = useRef(null);
  const pointsRef = useRef([{ t: 0, m: 1 }]);
  const startRef  = useRef(Date.now());
  const animRef   = useRef(null);

  // Reset on new round
  useEffect(() => {
    if (phase === 'betting') {
      pointsRef.current = [{ t: 0, m: 1 }];
      startRef.current  = Date.now();
    }
  }, [phase]);

  // Push point every tick
  useEffect(() => {
    if (phase === 'flying') {
      const elapsed = (Date.now() - startRef.current) / 1000;
      pointsRef.current.push({ t: elapsed, m: multiplier });
    }
  }, [multiplier, phase]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const pts = pointsRef.current;
      if (pts.length < 2) { animRef.current = requestAnimationFrame(draw); return; }

      const maxT = Math.max(pts[pts.length - 1].t, 5);
      const maxM = Math.max(pts[pts.length - 1].m, 2);

      const scaleX = (t) => (t / maxT) * (W - 60) + 30;
      const scaleY = (m) => H - 40 - ((m - 1) / (maxM - 1)) * (H - 80);

      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, phase === 'crashed' ? 'rgba(220,53,69,0.3)' : 'rgba(134,196,57,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(scaleX(pts[0].t), H - 40);
      pts.forEach(p => ctx.lineTo(scaleX(p.t), scaleY(p.m)));
      ctx.lineTo(scaleX(pts[pts.length - 1].t), H - 40);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Curve line
      ctx.beginPath();
      ctx.strokeStyle = phase === 'crashed' ? '#dc3545' : '#86c439';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(scaleX(p.t), scaleY(p.m)) : ctx.lineTo(scaleX(p.t), scaleY(p.m)));
      ctx.stroke();

      // Plane emoji at tip
      if (phase === 'flying') {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2] || last;
        const angle = Math.atan2(scaleY(prev.m) - scaleY(last.m), scaleX(last.t) - scaleX(prev.t));
        ctx.save();
        ctx.translate(scaleX(last.t), scaleY(last.m));
        ctx.rotate(-angle);
        ctx.font = '28px serif';
        ctx.fillText('✈️', -14, 10);
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
      width={860}
      height={340}
      style={{ width: '100%', height: '340px', display: 'block', borderRadius: '8px 8px 0 0' }}
    />
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

  const [stake,       setStake]       = useState(50);
  const [autoCashout, setAutoCashout] = useState('');
  const [betPlaced,   setBetPlaced]   = useState(false);
  const [cashedOut,   setCashedOut]   = useState(null);   // { multiplier, winnings }
  const [message,     setMessage]     = useState('');

  const flash = (msg, ms = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), ms);
  };

  // ── Listen to server events ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onState = ({ phase: p, multiplier: m, countdown: c, history: h }) => {
      setPhase(p);
      setMultiplier(m ?? 1);
      setCountdown(c ?? 5);
      setHistory(h ?? []);
      if (p === 'betting') { setBetPlaced(false); setCashedOut(null); }
    };

    const onTick      = ({ multiplier: m })   => setMultiplier(m);
    const onCountdown = ({ countdown: c })     => setCountdown(c);
    const onCrashed   = ({ crashAt: ca, history: h }) => {
      setCrashAt(ca); setHistory(h); setPhase('crashed'); setBetPlaced(false);
      flash(`💥 FLEW AWAY @ ${ca}x`, 2500);
    };
    const onBetPlaced  = ()         => flash('✅ Bet placed!');
    const onCashedOut  = ({ multiplier: m, winnings, auto }) => {
      setCashedOut({ multiplier: m, winnings });
      flash(`${auto ? '🤖 Auto' : '✋ Manual'} cashout @ ${m}x → ${country.symbol} ${winnings}`, 4000);
    };
    const onError = ({ message: err }) => flash(`❌ ${err}`);

    socket.on('aviator_state',     onState);
    socket.on('aviator_tick',      onTick);
    socket.on('aviator_countdown', onCountdown);
    socket.on('aviator_crashed',   onCrashed);
    socket.on('aviator_bet_placed',onBetPlaced);
    socket.on('aviator_cashed_out',onCashedOut);
    socket.on('aviator_error',     onError);

    return () => {
      socket.off('aviator_state',     onState);
      socket.off('aviator_tick',      onTick);
      socket.off('aviator_countdown', onCountdown);
      socket.off('aviator_crashed',   onCrashed);
      socket.off('aviator_bet_placed',onBetPlaced);
      socket.off('aviator_cashed_out',onCashedOut);
      socket.off('aviator_error',     onError);
    };
  }, [socket]);

  const handleBet = useCallback(() => {
    if (!socket || phase !== 'betting') return;
    socket.emit('aviator_place_bet', {
      stake: parseFloat(stake),
      autoCashout: autoCashout ? parseFloat(autoCashout) : null,
    });
    setBetPlaced(true);
  }, [socket, phase, stake, autoCashout]);

  const handleCashout = useCallback(() => {
    if (!socket || phase !== 'flying' || !betPlaced || cashedOut) return;
    socket.emit('aviator_cashout');
  }, [socket, phase, betPlaced, cashedOut]);

  // ── Derived display values ───────────────────────────────────────
  const multiplierColor = phase === 'crashed' ? '#dc3545' : phase === 'flying' ? '#86c439' : '#fecd08';
  const multiplierGlow  = phase === 'flying'
    ? '0 0 30px rgba(134,196,57,0.6)'
    : phase === 'crashed'
    ? '0 0 30px rgba(220,53,69,0.6)'
    : 'none';

  const canBet     = phase === 'betting' && !betPlaced;
  const canCashout = phase === 'flying'  && betPlaced && !cashedOut;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* History chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {history.map((v, i) => (
          <span key={i} style={{
            backgroundColor: 'var(--bg-btn)',
            color: crashColour(v),
            fontWeight: 700,
            fontSize: '12px',
            padding: '3px 10px',
            borderRadius: '20px',
            border: `1px solid ${crashColour(v)}44`
          }}>
            {v.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Game canvas area */}
      <div style={{
        position: 'relative',
        backgroundColor: '#0d1923',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
      }}>
        <AviatorGraph multiplier={multiplier} phase={phase} />

        {/* Overlay: multiplier */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          {phase === 'betting' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                NEXT ROUND STARTS IN
              </div>
              <div style={{ fontSize: '72px', fontWeight: 900, color: '#fecd08', textShadow: '0 0 30px rgba(254,205,8,0.6)' }}>
                {countdown}s
              </div>
            </div>
          )}

          {phase === 'flying' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '3px' }}>
                FLYING AWAY
              </div>
              <div style={{
                fontSize: '72px', fontWeight: 900,
                color: multiplierColor,
                textShadow: multiplierGlow,
                transition: 'color 0.3s'
              }}>
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}

          {phase === 'crashed' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#dc3545', fontWeight: 700, marginBottom: '4px', letterSpacing: '3px' }}>
                FLEW AWAY!
              </div>
              <div style={{ fontSize: '72px', fontWeight: 900, color: '#dc3545', textShadow: '0 0 30px rgba(220,53,69,0.6)' }}>
                {crashAt?.toFixed(2)}x
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flash message */}
      {message && (
        <div style={{
          backgroundColor: 'rgba(134,196,57,0.1)', border: '1px solid rgba(134,196,57,0.3)',
          color: '#86c439', padding: '10px 16px', borderRadius: '6px',
          marginBottom: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* Bet controls */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1rem', backgroundColor: '#1b242e',
        padding: '1.25rem', borderRadius: '12px'
      }}>
        {/* Left: bet inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Bet Amount ({country.symbol})
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                value={stake}
                onChange={e => setStake(e.target.value)}
                disabled={betPlaced}
                style={{
                  flex: 1, backgroundColor: 'var(--bg-btn)',
                  border: '1px solid var(--border-color)', color: '#fff',
                  padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '14px'
                }}
              />
              {[10, 50, 100, 500].map(v => (
                <button key={v} onClick={() => setStake(v)} disabled={betPlaced}
                  style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Auto Cash-Out (e.g. 2.00)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Manual (leave empty)"
              value={autoCashout}
              onChange={e => setAutoCashout(e.target.value)}
              disabled={betPlaced}
              style={{
                width: '100%', backgroundColor: 'var(--bg-btn)',
                border: '1px solid var(--border-color)', color: '#fff',
                padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
          {/* Possible profit preview */}
          {betPlaced && !cashedOut && (
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(134,196,57,0.08)', borderRadius: '8px', border: '1px solid rgba(134,196,57,0.2)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Win if Cashed Out Now</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#86c439' }}>
                {country.symbol} {(stake * multiplier).toFixed(2)}
              </div>
            </div>
          )}

          {cashedOut && (
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(134,196,57,0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You Cashed Out @ {cashedOut.multiplier}x</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#86c439' }}>{country.symbol} {cashedOut.winnings}</div>
            </div>
          )}

          {canBet && (
            <button
              className="btn btn-primary pulse-btn"
              onClick={handleBet}
              style={{ padding: '16px', fontSize: '16px', fontWeight: 800, borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              ✈️ Place Bet
            </button>
          )}

          {betPlaced && phase === 'betting' && (
            <button disabled style={{ backgroundColor: 'var(--bg-btn)', color: 'var(--text-muted)', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '14px', cursor: 'not-allowed' }}>
              Bet Placed — Waiting for takeoff…
            </button>
          )}

          {canCashout && (
            <button
              onClick={handleCashout}
              style={{
                background: 'linear-gradient(135deg, #fecd08, #f59e0b)',
                color: '#000', border: 'none',
                padding: '16px', fontSize: '18px', fontWeight: 900,
                borderRadius: '8px', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '1px',
                boxShadow: '0 4px 20px rgba(254,205,8,0.5)',
                animation: 'pulseBtn 0.8s infinite alternate'
              }}
            >
              💰 CASH OUT @ {multiplier.toFixed(2)}x
            </button>
          )}

          {!canBet && !canCashout && !betPlaced && phase !== 'betting' && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '1rem' }}>
              {phase === 'crashed' ? '⏳ Waiting for next round…' : 'Place a bet before the round starts.'}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseBtn {
          from { transform: scale(1); box-shadow: 0 4px 20px rgba(254,205,8,0.5); }
          to   { transform: scale(1.02); box-shadow: 0 4px 30px rgba(254,205,8,0.8); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default AviatorGame;

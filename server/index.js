const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─────────────────────────────────────────────────────────────────
// DATA STORES
// ─────────────────────────────────────────────────────────────────

// 1. Live matches
let liveMatches = [
  { id: 101, country: 'England • Premier League', home: 'Man Utd', away: 'Liverpool',     score: '1 - 0', minute: 34, status: 'live', odds: [1.95, 3.60, 3.80] },
  { id: 102, country: 'Spain • La Liga',           home: 'Real Madrid', away: 'Atletico', score: '0 - 0', minute: 67, status: 'live', odds: [1.65, 3.80, 5.10] },
  { id: 103, country: 'Germany • Bundesliga',      home: 'Bayern', away: 'Dortmund',      score: '2 - 1', minute: 80, status: 'live', odds: [1.40, 4.50, 7.00] },
  { id: 104, country: 'Italy • Serie A',           home: 'Juventus', away: 'Napoli',      score: '0 - 1', minute: 22, status: 'live', odds: [2.90, 3.20, 2.30] },
  { id: 105, country: 'France • Ligue 1',          home: 'PSG', away: 'Lyon',             score: '3 - 0', minute: 88, status: 'live', odds: [1.10, 8.00, 18.00] },
  { id: 106, country: 'Portugal • Primeira Liga',  home: 'Benfica', away: 'Porto',        score: '1 - 1', minute: 55, status: 'live', odds: [2.20, 3.40, 3.10] },
  { id: 107, country: 'Netherlands • Eredivisie',  home: 'Ajax', away: 'Feyenoord',      score: '0 - 0', minute: 41, status: 'live', odds: [1.85, 3.50, 4.20] },
  { id: 108, country: 'Turkey • Süper Lig',        home: 'Galatasaray', away: 'Fenerbahçe', score: '2 - 2', minute: 73, status: 'live', odds: [2.80, 3.20, 2.50] },
];

// 2. Highlights / Upcoming matches
const generateFutureDate = (daysAhead, hoursStr) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}, ${hoursStr}`;
};

const LEAGUES = [
  'England • Premier League', 'Spain • La Liga', 'Italy • Serie A', 'Germany • Bundesliga',
  'France • Ligue 1', 'Netherlands • Eredivisie', 'Portugal • Primeira Liga',
  'Argentina • Primera LPF', 'Brazil • Serie A', 'USA • MLS', 'Mexico • Liga MX',
  'Japan • J-League', 'Australia • A-League', 'Kenya • FKF Premier'
];

const TEAMS = {
  'England • Premier League': [['Arsenal', 'Chelsea'], ['Man City', 'Spurs'], ['Liverpool', 'Everton'], ['Man Utd', 'Aston Villa']],
  'Spain • La Liga': [['Real Madrid', 'Barcelona'], ['Atletico', 'Sevilla'], ['Valencia', 'Villarreal'], ['Betis', 'Sociedad']],
  'Italy • Serie A': [['Juventus', 'Milan'], ['Inter', 'Roma'], ['Napoli', 'Lazio'], ['Atalanta', 'Fiorentina']],
  'Germany • Bundesliga': [['Bayern', 'Dortmund'], ['Leipzig', 'Leverkusen'], ['Frankfurt', 'Wolfsburg'], ['Gladbach', 'Stuttgart']],
  'France • Ligue 1': [['PSG', 'Marseille'], ['Lyon', 'Monaco'], ['Lille', 'Rennes'], ['Nice', 'Lens']],
  'Netherlands • Eredivisie': [['Ajax', 'PSV'], ['Feyenoord', 'AZ'], ['Twente', 'Utrecht'], ['Vitesse', 'Heerenveen']],
  'Portugal • Primeira Liga': [['Benfica', 'Porto'], ['Sporting', 'Braga'], ['Vitoria', 'Rio Ave'], ['Boavista', 'Famalicao']],
  'Argentina • Primera LPF': [['Boca Juniors', 'River Plate'], ['Racing Club', 'Independiente'], ['San Lorenzo', 'Huracan'], ['Velez', 'Lanus']],
  'Brazil • Serie A': [['Flamengo', 'Palmeiras'], ['Santos', 'Sao Paulo'], ['Corinthians', 'Gremio'], ['Atletico Mineiro', 'Fluminense']],
  'USA • MLS': [['LA Galaxy', 'LAFC'], ['Seattle', 'Portland'], ['Atlanta', 'Miami'], ['NYFC', 'Red Bulls']],
  'Mexico • Liga MX': [['Club America', 'Chivas'], ['Cruz Azul', 'Pumas'], ['Tigres', 'Monterrey'], ['Toluca', 'Pachuca']],
  'Japan • J-League': [['Kawasaki', 'Yokohama'], ['Urawa', 'Kashima'], ['Gamba', 'Cerezo'], ['FC Tokyo', 'Nagoya']],
  'Australia • A-League': [['Sydney FC', 'Melbourne'], ['Wanderers', 'Brisbane'], ['Adelaide', 'Perth'], ['Central Coast', 'Wellington']],
  'Kenya • FKF Premier': [['Gor Mahia', 'AFC Leopards'], ['Tusker', 'Bandari'], ['Police FC', 'Ulinzi Stars'], ['Sofapaka', 'Kakamega']]
};

let highlightMatches = [];
let matchIdCounter = 1;

for (let day = 0; day <= 7; day++) {
  const numMatches = day === 0 ? 8 : 15; // fewer matches today as many are live
  for (let i = 0; i < numMatches; i++) {
    const league = LEAGUES[Math.floor(Math.random() * LEAGUES.length)];
    const teamPair = TEAMS[league][Math.floor(Math.random() * TEAMS[league].length)];
    
    // random hours
    const hour = Math.floor(Math.random() * 10) + 12; // 12:00 to 21:00
    const min = Math.random() > 0.5 ? '00' : '30';
    
    const odd1 = (Math.random() * 2 + 1.1).toFixed(2);
    const oddX = (Math.random() * 2 + 2.5).toFixed(2);
    const odd2 = (Math.random() * 4 + 1.5).toFixed(2);

    highlightMatches.push({
      id: matchIdCounter++,
      country: league,
      home: teamPair[0],
      away: teamPair[1],
      date: generateFutureDate(day, `${hour}:${min}`),
      odds: [parseFloat(odd1), parseFloat(oddX), parseFloat(odd2)]
    });
  }
}\n\n// 3. Jackpot data
let jackpot = {
  mega: { name: 'Mega Jackpot', amount: 100_000_000, currency: 'KSh', games: 17, minStake: 99 },
  mid:  { name: 'Mid Week Jackpot', amount: 10_000_000, currency: 'KSh', games: 13, minStake: 49 },
  liga: { name: 'Ligi Bigi Jackpot', amount: 5_000_000, currency: 'KSh', games: 15, minStake: 49 },
};

// 4. Shared betslip store (in-memory, keyed by code)
const sharedBetslips = {};

// 5. Live match count (used in navbar)
let liveCount = liveMatches.length;

// 9. Leaderboard
let leaderboard = [
  { phone: '07****23', amount: 85400, game: 'Jackpot',           flag: '🇰🇪' },
  { phone: '08****17', amount: 42100, game: 'Aviator',           flag: '🇳🇬' },
  { phone: '07****55', amount: 31250, game: 'Virtual Champions', flag: '🇬🇭' },
  { phone: '07****99', amount: 18700, game: 'Casino',            flag: '🇿🇦' },
  { phone: '08****34', amount: 9850,  game: 'Crash',             flag: '🇺🇬' },
];

// 10. Admin stats
let adminStats = { totalBets: 0, totalStaked: 0, activeUsers: 0, betsLog: [] };

// 11. Jackpot pool
let jackpotPool = { current: 2_340_000, target: 5_000_000 };

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const jitter = (value, maxChange = 0.12) => {
  const delta = Math.random() * maxChange * 2 - maxChange;
  return Math.max(1.01, parseFloat((value + delta).toFixed(2)));
};

const maybeScore = (match) => {
  if (Math.random() < 0.04) {
    const [h, a] = match.score.split(' - ').map(Number);
    match.score = Math.random() < 0.55
      ? `${h + 1} - ${a}`
      : `${h} - ${a + 1}`;
  }
};

const maybeEndMatch = (match) => {
  if (match.minute >= 90 && Math.random() < 0.1) {
    match.status = 'finished';
    return true;
  }
  return false;
};

// 6. Virtual sports (each resets every 3-5 minutes)
let virtualSports = [
  { id: 'vengland',  name: 'Virtual English League', icon: '⚽', odds: [1.95, 3.40, 4.10], countdown: 35, maxCountdown: 180, results: [] },
  { id: 'vspain',    name: 'Virtual Spanish League', icon: '⚽', odds: [2.30, 3.10, 2.80], countdown: 105, maxCountdown: 180, results: [] },
  { id: 'vchampions',name: 'Virtual Champions',      icon: '🏆', odds: [2.10, 3.20, 3.50], countdown: 145, maxCountdown: 180, results: [] },
  { id: 'vworld',    name: 'Virtual World Cup',      icon: '🌍', odds: [1.80, 3.60, 4.50], countdown: 15, maxCountdown: 180, results: [] },
  { id: 'vbasket',   name: 'Virtual Basketball',     icon: '🏀', odds: [1.85, 3.20, 3.80], countdown: 92, maxCountdown: 240, results: [] },
  { id: 'vhorses',   name: 'Virtual Horse Racing',   icon: '🐎', odds: [3.40, 5.60, 8.20, 12.0, 2.10], countdown: 25, maxCountdown: 120, results: [] },
  { id: 'vdogs',     name: 'Virtual Greyhounds',     icon: '🐕', odds: [4.50, 6.00, 3.20, 7.80, 2.30, 5.10], countdown: 38, maxCountdown: 90,  results: [] },
];

// 7. Casino live player counts
let casinoActivity = [
  { id: 'roulette',   name: 'Roulette',       icon: '🎡', colour: '#dc3545', players: 142, lastWinAmount: 8400 },
  { id: 'blackjack',  name: 'Blackjack',      icon: '🃏', colour: '#fecd08', players: 98,  lastWinAmount: 3200 },
  { id: 'baccarat',   name: 'Baccarat',       icon: '🎴', colour: '#00a651', players: 76,  lastWinAmount: 12750 },
  { id: 'dragon',     name: 'Dragon Tiger',   icon: '🐉', colour: '#ff4757', players: 54,  lastWinAmount: 4600 },
  { id: 'teenpatti',  name: 'Teen Patti',     icon: '🤌', colour: '#8e44ad', players: 39,  lastWinAmount: 2100 },
  { id: 'spinwin',    name: 'Spin & Win',     icon: '🎰', colour: '#e67e22', players: 203, lastWinAmount: 51000 },
  { id: 'dice',       name: 'Dice',           icon: '🎲', colour: '#1abc9c', players: 67,  lastWinAmount: 7800 },
  { id: 'hilo',       name: 'Hi-Lo',          icon: '🔼', colour: '#3498db', players: 88,  lastWinAmount: 1950 },
];

// 8. Betika Fasta — fast-settling 60-second mini-markets
const FASTA_TEMPLATES = [
  { home: 'Zoom FC Red',    away: 'Zoom FC Blue' },
  { home: 'Alpha United',   away: 'Beta City' },
  { home: 'Sprint FC',      away: 'Turbo Athletic' },
  { home: 'Flash Rovers',   away: 'Bolt United' },
  { home: 'Rapid Stars',    away: 'Lightning FC' },
];
let fastaMarkets = FASTA_TEMPLATES.map((t, i) => ({
  id: 200 + i, ...t,
  odds: [jitter(2.0, 0.3), jitter(3.2, 0.3), jitter(2.5, 0.3)],
  expiresIn: 60 - (i * 12), // stagger expiry
  settled: false,
}));


// ─────────────────────────────────────────────────────────────────
// TICK: LIVE MATCHES — every 3 seconds
// ─────────────────────────────────────────────────────────────────
setInterval(() => {
  liveMatches = liveMatches.map(match => {
    if (match.status === 'finished') return match;
    maybeScore(match);
    const newMinute = Math.min(match.minute + 1, 90);
    const finished = maybeEndMatch({ ...match, minute: newMinute });
    return {
      ...match,
      minute: newMinute,
      status: finished ? 'finished' : 'live',
      odds: match.odds.map(o => jitter(o)),
    };
  });

  liveCount = liveMatches.filter(m => m.status === 'live').length;

  io.emit('live_match_update', liveMatches);
  io.emit('live_count_update', liveCount);
}, 3000);

// ─────────────────────────────────────────────────────────────────
// TICK: HIGHLIGHT ODDS — gentle drift every 8 seconds
// ─────────────────────────────────────────────────────────────────
setInterval(() => {
  highlightMatches = highlightMatches.map(match => ({
    ...match,
    odds: match.odds.map(o => jitter(o, 0.06)),
  }));
  io.emit('highlight_update', highlightMatches);
}, 8000);

// ─────────────────────────────────────────────────────────────────
// TICK: JACKPOT — grows every 10 seconds
// ─────────────────────────────────────────────────────────────────
setInterval(() => {
  jackpot.mega.amount += Math.floor(Math.random() * 50000 + 10000);
  jackpot.mid.amount  += Math.floor(Math.random() * 5000  + 1000);
  jackpot.liga.amount += Math.floor(Math.random() * 2000  + 500);
  io.emit('jackpot_update', jackpot);
}, 10000);

// ─────────────────────────────────────────────────────────────────
// TICK: VIRTUAL SPORTS — countdown + odds drift every second
// ─────────────────────────────────────────────────────────────────
setInterval(() => {
  virtualSports = virtualSports.map(vs => {
    let { countdown, maxCountdown, results } = vs;
    countdown -= 1;
    if (countdown <= 0) {
      // New round: pick a winner index and record result
      const winnerIdx = Math.floor(Math.random() * vs.odds.length);
      results = [{ winnerIdx, at: Date.now() }, ...results].slice(0, 10);
      countdown = maxCountdown;
    }
    return {
      ...vs,
      countdown,
      results,
      odds: vs.odds.map(o => jitter(o, 0.05)),
    };
  });
  io.emit('virtual_update', virtualSports);
}, 1000);

// ─────────────────────────────────────────────────────────────────
// TICK: CASINO ACTIVITY — player count drift every 4 seconds
// ─────────────────────────────────────────────────────────────────
setInterval(() => {
  casinoActivity = casinoActivity.map(g => {
    const delta = Math.floor(Math.random() * 9) - 4;   // -4 to +4
    const players = Math.max(5, g.players + delta);
    const amounts = [1950, 2100, 3200, 4600, 5400, 7800, 8400, 12750, 21000, 51000];
    const lastWinAmount = amounts[Math.floor(Math.random() * amounts.length)];
    return { ...g, players, lastWinAmount };
  });
  io.emit('casino_activity', casinoActivity);
}, 4000);

// ─────────────────────────────────────────────────────────────────
// TICK: BETIKA FASTA — 60-second fast markets with odds drift
// ─────────────────────────────────────────────────────────────────
setInterval(() => {
  fastaMarkets = fastaMarkets.map(m => {
    let { expiresIn } = m;
    expiresIn -= 1;
    if (expiresIn <= 0) {
      // Settle old market + create new one from random template
      const tpl = FASTA_TEMPLATES[Math.floor(Math.random() * FASTA_TEMPLATES.length)];
      return {
        ...m, ...tpl,
        odds: [jitter(2.0, 0.3), jitter(3.2, 0.3), jitter(2.5, 0.3)],
        expiresIn: 60,
        settled: false,
      };
    }
    return { ...m, expiresIn, odds: m.odds.map(o => jitter(o, 0.08)) };
  });
  io.emit('fasta_update', fastaMarkets);
}, 1000);

// ─────────────────────────────────────────────────────────────────
// SOCKET.IO CONNECTION
// ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send current snapshots immediately
  socket.emit('live_match_update', liveMatches);
  socket.emit('live_count_update', liveCount);
  socket.emit('highlight_update', highlightMatches);
  socket.emit('jackpot_update', jackpot);
  socket.emit('virtual_update', virtualSports);
  socket.emit('casino_activity', casinoActivity);
  socket.emit('fasta_update', fastaMarkets);
  socket.emit('leaderboard_update', leaderboard);
  socket.emit('jackpot_pool_update', jackpotPool);
  socket.emit('admin_stats', adminStats);
  adminStats.activeUsers = io.engine.clientsCount;

  // ── Betslip sharing ──────────────────────────────────────────
  socket.on('save_betslip', ({ bets }) => {
    // Generate a random 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    sharedBetslips[code] = { bets, savedAt: Date.now() };
    socket.emit('betslip_saved', { code });
    console.log(`💾 Betslip saved: ${code}`);
  });

  socket.on('load_betslip', ({ code }) => {
    const entry = sharedBetslips[code.toUpperCase()];
    if (entry) {
      socket.emit('betslip_loaded', { bets: entry.bets });
    } else {
      socket.emit('betslip_error', { message: `No betslip found for code: ${code}` });
    }
  });

  // ── Place bet ────────────────────────────────────────────────
  socket.on('place_bet', ({ bets, stake }) => {
    // In production: validate, deduct balance, write to DB
    const totalOdds = bets.reduce((acc, b) => acc * b.odds, 1);
    const possibleWin = (totalOdds * stake).toFixed(2);
    const ticketRef = 'BET-' + Date.now();
    socket.emit('bet_confirmed', { ticketRef, totalOdds: totalOdds.toFixed(2), possibleWin, stake });
    // Update admin stats
    adminStats.totalBets += 1;
    adminStats.totalStaked += parseFloat(stake);
    adminStats.betsLog = [{ ticketRef, stake, possibleWin, time: new Date().toISOString() }, ...adminStats.betsLog].slice(0, 50);
    // Grow jackpot pool
    jackpotPool.current = Math.min(jackpotPool.target, jackpotPool.current + parseFloat(stake) * 0.05);
    io.emit('jackpot_pool_update', jackpotPool);
    io.emit('admin_stats', adminStats);
    console.log(`🎟️  Bet placed ${ticketRef} | Stake: ${stake} | Win: ${possibleWin}`);
  });

  socket.on('disconnect', () => {
    delete aviator.players[socket.id];
    adminStats.activeUsers = Math.max(0, adminStats.activeUsers - 1);
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // ── Aviator: place bet during BETTING phase ───────────────────
  socket.on('aviator_place_bet', ({ stake, autoCashout }) => {
    if (aviator.phase !== 'betting') {
      socket.emit('aviator_error', { message: 'Betting is closed for this round.' });
      return;
    }
    aviator.players[socket.id] = {
      stake: parseFloat(stake),
      autoCashout: autoCashout ? parseFloat(autoCashout) : null,
      cashedOut: false,
      cashoutMultiplier: null,
    };
    socket.emit('aviator_bet_placed', { stake, autoCashout });
  });

  // ── Aviator: manual cash-out during FLYING phase ──────────────
  socket.on('aviator_cashout', () => {
    const player = aviator.players[socket.id];
    if (!player || player.cashedOut || aviator.phase !== 'flying') {
      socket.emit('aviator_error', { message: 'Cannot cash out right now.' });
      return;
    }
    player.cashedOut = true;
    player.cashoutMultiplier = aviator.multiplier;
    const winnings = (player.stake * player.cashoutMultiplier).toFixed(2);
    socket.emit('aviator_cashed_out', {
      multiplier: player.cashoutMultiplier,
      stake: player.stake,
      winnings,
    });
    console.log(`✈️  Cashout: ${socket.id} @ ${player.cashoutMultiplier}x → KSh ${winnings}`);
  });

  // Send current aviator state on connect
  socket.emit('aviator_state', {
    phase:      aviator.phase,
    multiplier: aviator.multiplier,
    countdown:  aviator.countdown,
    history:    aviator.history,
  });

  socket.on('disconnect', () => {
    delete aviator.players[socket.id];
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────────────
// AVIATOR GAME ENGINE
// ─────────────────────────────────────────────────────────────────
/*
  Phases:
    betting  → 5-second window to place bets
    flying   → multiplier rises until crash
    crashed  → 2-second pause showing crash screen
*/

const aviator = {
  phase:      'betting',
  multiplier: 1.00,
  crashAt:    1.00,
  countdown:  5,
  history:    [],           // last 20 crash points
  players:    {},           // socketId → { stake, autoCashout, cashedOut, cashoutMultiplier }
  tickInterval: null,
};

/** Generate a crash point with house edge ~5 % */
const generateCrashPoint = () => {
  const r = Math.random();
  // Provably-fair-style distribution: P(crash ≥ x) = 0.95 / x
  const crash = 0.95 / (1 - r);
  return Math.max(1.00, parseFloat(crash.toFixed(2)));
};

const startBettingPhase = () => {
  aviator.phase      = 'betting';
  aviator.multiplier = 1.00;
  aviator.countdown  = 5;
  aviator.players    = {};
  aviator.crashAt    = generateCrashPoint();

  io.emit('aviator_state', {
    phase:     'betting',
    countdown: aviator.countdown,
    multiplier: 1.00,
    history:   aviator.history,
  });

  // Countdown tick every second
  let count = aviator.countdown;
  const cdInterval = setInterval(() => {
    count -= 1;
    if (count <= 0) {
      clearInterval(cdInterval);
      startFlyingPhase();
    } else {
      io.emit('aviator_countdown', { countdown: count });
    }
  }, 1000);
};

const startFlyingPhase = () => {
  aviator.phase      = 'flying';
  aviator.multiplier = 1.00;

  io.emit('aviator_state', {
    phase:      'flying',
    multiplier: 1.00,
    history:    aviator.history,
  });

  // Multiplier rises every 100 ms
  aviator.tickInterval = setInterval(() => {
    // Exponential growth: +~3 % per 100 ms
    aviator.multiplier = parseFloat((aviator.multiplier * 1.03).toFixed(2));

    // Auto-cashout for players who set a target
    Object.entries(aviator.players).forEach(([sid, player]) => {
      if (!player.cashedOut && player.autoCashout && aviator.multiplier >= player.autoCashout) {
        player.cashedOut = true;
        player.cashoutMultiplier = aviator.multiplier;
        const winnings = (player.stake * player.cashoutMultiplier).toFixed(2);
        const sock = io.sockets.sockets.get(sid);
        if (sock) {
          sock.emit('aviator_cashed_out', {
            multiplier: player.cashoutMultiplier,
            stake: player.stake,
            winnings,
            auto: true,
          });
        }
      }
    });

    io.emit('aviator_tick', { multiplier: aviator.multiplier });

    // Check crash
    if (aviator.multiplier >= aviator.crashAt) {
      clearInterval(aviator.tickInterval);
      crashGame();
    }
  }, 100);
};

const crashGame = () => {
  aviator.phase = 'crashed';

  // Record crash point in history (keep last 20)
  aviator.history.unshift(aviator.crashAt);
  if (aviator.history.length > 20) aviator.history.pop();

  io.emit('aviator_crashed', {
    crashAt: aviator.crashAt,
    history: aviator.history,
  });

  console.log(`✈️  CRASHED @ ${aviator.crashAt}x`);

  // After 3 s, start next betting phase
  setTimeout(startBettingPhase, 3000);
};

// Kick off the first round
startBettingPhase();

// ─────────────────────────────────────────────────────────────────
// REST ENDPOINTS
// ─────────────────────────────────────────────────────────────────
app.get('/health',      (_, res) => res.json({ status: 'ok', liveCount, uptime: process.uptime() }));
app.get('/live',        (_, res) => res.json(liveMatches));
app.get('/highlights',  (_, res) => res.json(highlightMatches));
app.get('/jackpots',    (_, res) => res.json(jackpot));
app.get('/aviator',     (_, res) => res.json({ phase: aviator.phase, multiplier: aviator.multiplier, history: aviator.history }));

// Simulated deposit endpoint
app.post('/api/deposit', (req, res) => {
  const { amount, phone, method } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ ok: false, error: 'Invalid amount' });
  // Simulate M-Pesa STK push delay
  setTimeout(() => {}, 2000);
  res.json({ ok: true, ref: 'DEP-' + Date.now(), amount, method: method || 'M-Pesa', message: 'STK push sent to ' + phone });
});

app.post('/api/withdraw', (req, res) => {
  const { amount, phone } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ ok: false, error: 'Invalid amount' });
  res.json({ ok: true, ref: 'WDR-' + Date.now(), amount, message: 'Withdrawal of ' + amount + ' initiated to ' + phone });
});

// Leaderboard — shuffle/drift every 15 seconds
const LEADERBOARD_NAMES = [
  { phone: '07****23', flag: '🇰🇪' }, { phone: '08****17', flag: '🇳🇬' },
  { phone: '07****55', flag: '🇬🇭' }, { phone: '07****99', flag: '🇿🇦' },
  { phone: '08****34', flag: '🇺🇬' }, { phone: '07****01', flag: '🇹🇿' },
  { phone: '09****88', flag: '🇰🇪' }, { phone: '07****77', flag: '🇳🇬' },
];
const LEADERBOARD_GAMES = ['Jackpot', 'Aviator', 'Virtual Champions', 'Casino', 'Crash', 'Virtual World Cup', 'BetsWal Fasta'];
setInterval(() => {
  leaderboard = LEADERBOARD_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, 5).map((p, i) => ({
    ...p,
    amount: Math.floor(Math.random() * 90000) + 5000,
    game: LEADERBOARD_GAMES[Math.floor(Math.random() * LEADERBOARD_GAMES.length)],
  })).sort((a, b) => b.amount - a.amount);
  io.emit('leaderboard_update', leaderboard);
}, 15000);

// Admin stats heartbeat every 5s
setInterval(() => {
  adminStats.activeUsers = io.engine.clientsCount;
  io.emit('admin_stats', adminStats);
}, 5000);

// Serve React frontend (dist folder)
app.use(express.static(path.join(__dirname, '../dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🟢 BetsWal WebSocket server on port ${PORT}`);
  console.log(`   Events: live_match_update | live_count_update | highlight_update | jackpot_update | aviator_tick | aviator_crashed`);
  console.log(`   Client events: save_betslip | load_betslip | place_bet | aviator_place_bet | aviator_cashout`);
});


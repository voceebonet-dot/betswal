require('dotenv').config();
const express = require('express');
const http = require('http');
const twilio = require('twilio');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB, User, Bet, Transaction, SharedBetslip, Withdrawal } = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'betswal-dev-secret-change-in-prod';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '0000000000';

const signToken = (user) => jwt.sign(
  { userId: user._id, phone: user.phone, role: user.role },
  JWT_SECRET,
  { expiresIn: '30d' }
);

const verifyToken = (token) => {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
};

connectDB().then(async () => {
  // Load persistent admin stats from DB on startup
  try {
    const agg = await Bet.aggregate([{ $group: { _id: null, total: { $sum: 1 }, staked: { $sum: '$stake' } } }]);
    if (agg.length > 0) {
      adminStats.totalBets   = agg[0].total  || 0;
      adminStats.totalStaked = agg[0].staked || 0;
      console.log(`📊 Loaded stats from DB: ${adminStats.totalBets} bets, ${adminStats.totalStaked} staked`);
    }
    // Load last 50 bets for log
    const recentBets = await Bet.find().sort({ createdAt: -1 }).limit(50).lean();
    adminStats.betsLog = recentBets.map(b => ({
      ticketRef: b.ticketRef, stake: b.stake, possibleWin: b.possibleWin,
      time: b.createdAt.toISOString(), status: b.status,
    }));
    // Load pending withdrawals
    const pending = await Withdrawal.find({ status: 'Pending' }).lean();
    adminStats.pendingWithdrawals = pending.map(w => ({
      reqId: w.reqId, phone: w.phone, amount: w.amount, status: w.status, time: w.createdAt.toISOString()
    }));
  } catch (err) {
    console.error('DB stats load error:', err.message);
  }
});

const app = express();
// Security middlewares
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*';
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST']
};
app.use(cors(corsOptions));
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
const io = new Server(server, { cors: corsOptions });

// Simple memory-based Rate Limiter for WebSockets
const socketRateLimits = new Map();
const checkRateLimit = (socketId, eventName, limit = 5, windowMs = 5000) => {
  const now = Date.now();
  const key = `${socketId}:${eventName}`;
  const record = socketRateLimits.get(key) || { count: 0, firstSeen: now };

  if (now - record.firstSeen > windowMs) {
    record.count = 1;
    record.firstSeen = now;
  } else {
    record.count++;
  }
  socketRateLimits.set(key, record);
  
  // Cleanup old entries randomly to prevent memory leaks in this simple implementation
  if (Math.random() < 0.05) {
    for (const [k, v] of socketRateLimits.entries()) {
      if (now - v.firstSeen > 60000) socketRateLimits.delete(k);
    }
  }

  return record.count <= limit;
};

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

const LEAGUES = {
  'Soccer': [
    'England • Premier League', 'Spain • La Liga', 'Italy • Serie A', 'Germany • Bundesliga',
    'France • Ligue 1', 'Netherlands • Eredivisie', 'Portugal • Primeira Liga',
    'Argentina • Primera LPF', 'Brazil • Serie A', 'USA • MLS', 'Mexico • Liga MX',
    'Kenya • FKF Premier'
  ],
  'Basketball': ['USA • NBA', 'Europe • EuroLeague', 'Spain • Liga ACB'],
  'Tennis': ['ATP • Wimbledon', 'WTA • US Open', 'ATP • Roland Garros'],
  'eSoccer': ['FIFA 23 • ePremier League', 'FIFA 23 • eChampions League'],
  'Table Tennis': ['Pro • Setka Cup', 'Pro • TT Cup'],
  'Boxing': ['Heavyweight Bout', 'Middleweight Bout'],
  'Rugby': ['England • Premiership', 'Australia • NRL']
};

const TEAMS = {
  // Soccer
  'England • Premier League': [['Arsenal', 'Chelsea'], ['Man City', 'Spurs'], ['Liverpool', 'Everton'], ['Man Utd', 'Aston Villa']],
  'Spain • La Liga': [['Real Madrid', 'Barcelona'], ['Atletico', 'Sevilla'], ['Valencia', 'Villarreal'], ['Betis', 'Sociedad']],
  'Italy • Serie A': [['Juventus', 'Milan'], ['Inter', 'Roma'], ['Napoli', 'Lazio'], ['Atalanta', 'Fiorentina']],
  'Germany • Bundesliga': [['Bayern', 'Dortmund'], ['Leipzig', 'Leverkusen'], ['Frankfurt', 'Wolfsburg']],
  'France • Ligue 1': [['PSG', 'Marseille'], ['Lyon', 'Monaco'], ['Lille', 'Rennes']],
  'Netherlands • Eredivisie': [['Ajax', 'PSV'], ['Feyenoord', 'AZ']],
  'Portugal • Primeira Liga': [['Benfica', 'Porto'], ['Sporting', 'Braga']],
  'Argentina • Primera LPF': [['Boca Juniors', 'River Plate'], ['Racing Club', 'Independiente']],
  'Brazil • Serie A': [['Flamengo', 'Palmeiras'], ['Santos', 'Sao Paulo']],
  'USA • MLS': [['LA Galaxy', 'LAFC'], ['Seattle', 'Portland']],
  'Mexico • Liga MX': [['Club America', 'Chivas'], ['Cruz Azul', 'Pumas']],
  'Kenya • FKF Premier': [['Gor Mahia', 'AFC Leopards'], ['Tusker', 'Bandari']],
  // Basketball
  'USA • NBA': [['Lakers', 'Warriors'], ['Celtics', 'Heat'], ['Bulls', 'Knicks'], ['Suns', 'Nuggets']],
  'Europe • EuroLeague': [['Real Madrid', 'Olympiacos'], ['Barcelona', 'Fenerbahce']],
  'Spain • Liga ACB': [['Real Madrid', 'Baskonia'], ['Barcelona', 'Unicaja']],
  // Tennis
  'ATP • Wimbledon': [['Alcaraz C.', 'Djokovic N.'], ['Sinner J.', 'Medvedev D.']],
  'WTA • US Open': [['Swiatek I.', 'Gauff C.'], ['Sabalenka A.', 'Rybakina E.']],
  'ATP • Roland Garros': [['Nadal R.', 'Ruud C.'], ['Zverev A.', 'Tsitsipas S.']],
  // eSoccer
  'FIFA 23 • ePremier League': [['eManCity', 'eLiverpool'], ['eArsenal', 'eChelsea']],
  'FIFA 23 • eChampions League': [['eRealMadrid', 'eBayern'], ['ePSG', 'eJuventus']],
  // Table Tennis
  'Pro • Setka Cup': [['Ivanov A.', 'Petrov B.'], ['Sidorov V.', 'Kuznetsov D.']],
  'Pro • TT Cup': [['Wang L.', 'Zhang M.'], ['Chen Y.', 'Liu H.']],
  // Boxing
  'Heavyweight Bout': [['Usyk O.', 'Fury T.'], ['Joshua A.', 'Wilder D.']],
  'Middleweight Bout': [['Canelo A.', 'Charlo J.'], ['Golovkin G.', 'Lara E.']],
  // Rugby
  'England • Premiership': [['Saracens', 'Bath'], ['Harlequins', 'Sale Sharks']],
  'Australia • NRL': [['Panthers', 'Broncos'], ['Storm', 'Roosters']]
};

let highlightMatches = [];
let matchIdCounter = 1;

for (let day = 0; day <= 7; day++) {
  // Generate matches for each sport
  Object.keys(LEAGUES).forEach(sport => {
    const numMatches = sport === 'Soccer' ? (day === 0 ? 8 : 12) : (day === 0 ? 3 : 5);
    
    for (let i = 0; i < numMatches; i++) {
      const leaguesForSport = LEAGUES[sport];
      const league = leaguesForSport[Math.floor(Math.random() * leaguesForSport.length)];
      const teamPair = TEAMS[league][Math.floor(Math.random() * TEAMS[league].length)];
      
      const hour = Math.floor(Math.random() * 10) + 12; // 12:00 to 21:00
      const min = Math.random() > 0.5 ? '00' : '30';
      
      const odd1 = (Math.random() * 2 + 1.1).toFixed(2);
      const oddX = (Math.random() * 2 + 2.5).toFixed(2);
      const odd2 = (Math.random() * 4 + 1.5).toFixed(2);

      highlightMatches.push({
        id: matchIdCounter++,
        sport: sport,
        country: league,
        home: teamPair[0],
        away: teamPair[1],
        date: generateFutureDate(day, `${hour}:${min}`),
        odds: [parseFloat(odd1), parseFloat(oddX), parseFloat(odd2)]
      });
    }
  });
}

// 3. Jackpot data
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

// 10. Admin stats (seeded from DB after connectDB resolves)
let adminStats = {
  totalBets: 0,
  totalStaked: 0,
  activeUsers: 0,
  betsLog: [],
  pendingWithdrawals: [],
};

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
// SOCKET.IO MIDDLEWARE — attach decoded user from JWT if present
// ─────────────────────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) socket.user = decoded;
  }
  next();
});

// ─────────────────────────────────────────────────────────────────
// SOCKET.IO CONNECTION
// ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}${socket.user ? ' (user: ' + socket.user.phone + ')' : ''}`);

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

  // Send balance to authenticated user
  if (socket.user) {
    User.findById(socket.user.userId).then(u => {
      if (u) socket.emit('balance_update', { balance: u.balance });
    }).catch(() => {});
  }

  adminStats.activeUsers = io.engine.clientsCount;

  // ── Admin Subscription ───────────────────────────────────────
  socket.on('admin_subscribe', () => {
    if (!socket.user || socket.user.role !== 'admin') {
      return socket.emit('admin_error', { message: 'Unauthorized' });
    }
    socket.join('admins');
    socket.emit('admin_stats', adminStats);
  });

  // ── Admin Actions ────────────────────────────────────────────
  socket.on('admin_settle_bet', async ({ ticketRef, status }) => {
    if (!socket.user || socket.user.role !== 'admin') return;
    // Update in-memory log
    const bet = adminStats.betsLog.find(b => b.ticketRef === ticketRef);
    if (bet) bet.status = status;
    // Persist to MongoDB and credit winnings if Won
    try {
      const dbBet = await Bet.findOneAndUpdate({ ticketRef }, { status }, { new: true });
      if (dbBet && status === 'Won' && dbBet.userId) {
        await User.findByIdAndUpdate(dbBet.userId, {
          $inc: { balance: dbBet.possibleWin, totalWon: dbBet.possibleWin }
        });
        await Transaction.create({ userId: dbBet.userId, phone: dbBet.phone, type: 'winnings', amount: dbBet.possibleWin, ref: ticketRef });
      }
    } catch (err) {
      console.error('DB Error settling bet:', err);
    }
    io.emit('bet_settled', { ticketRef, status });
    io.to('admins').emit('admin_stats', adminStats);
  });

  socket.on('admin_update_jackpot', ({ current, target }) => {
    jackpotPool.current = parseFloat(current) || jackpotPool.current;
    jackpotPool.target = parseFloat(target) || jackpotPool.target;
    io.emit('jackpot_pool_update', jackpotPool);
  });

  socket.on('admin_promo_broadcast', ({ message }) => {
    io.emit('promo_broadcast', { message });
  });

  socket.on('approve_withdrawal', async ({ reqId }) => {
    const req = adminStats.pendingWithdrawals.find(r => r.reqId === reqId);
    if (req) {
      req.status = 'Approved';
      io.emit('withdrawal_approved', { phone: req.phone, reqId: req.reqId, amount: req.amount });
      adminStats.pendingWithdrawals = adminStats.pendingWithdrawals.filter(r => r.reqId !== reqId);
      io.to('admins').emit('admin_stats', adminStats);
      try {
        await Withdrawal.findOneAndUpdate({ reqId }, { status: 'Approved' });
      } catch (err) {
        console.error('DB Error approving withdrawal:', err);
      }
    }
  });

  socket.on('reject_withdrawal', async ({ reqId }) => {
    const req = adminStats.pendingWithdrawals.find(r => r.reqId === reqId);
    if (req) {
      req.status = 'Rejected';
      io.emit('withdrawal_rejected', { phone: req.phone, reqId: req.reqId, amount: req.amount });
      adminStats.pendingWithdrawals = adminStats.pendingWithdrawals.filter(r => r.reqId !== reqId);
      io.to('admins').emit('admin_stats', adminStats);
      try {
        await Withdrawal.findOneAndUpdate({ reqId }, { status: 'Rejected' });
      } catch (err) {
        console.error('DB Error rejecting withdrawal:', err);
      }
    }
  });

  // ── User Withdrawal Request ──────────────────────────────────
  socket.on('request_withdrawal', async ({ phone, amount }) => {
    if (!checkRateLimit(socket.id, 'request_withdrawal', 3, 10000)) {
      return socket.emit('withdrawal_error', { message: 'Too many requests.' });
    }
    const reqId = 'WDR-' + Date.now();
    adminStats.pendingWithdrawals.push({ reqId, phone, amount, status: 'Pending', time: new Date().toISOString() });
    io.to('admins').emit('admin_stats', adminStats);
    try {
      await Withdrawal.create({ reqId, phone, amount, status: 'Pending' });
    } catch (err) {
      console.error('DB Error saving withdrawal:', err);
    }
  });

  // ── Betslip sharing ──────────────────────────────────────────
  socket.on('save_betslip', async ({ bets }) => {
    if (!checkRateLimit(socket.id, 'save_betslip', 5, 10000)) {
      return socket.emit('betslip_error', { message: 'Too many requests. Please wait.' });
    }
    if (!Array.isArray(bets) || bets.length === 0 || bets.length > 50) return;

    // Generate a unique 6-char code
    let code;
    let isUnique = false;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await SharedBetslip.findOne({ code });
      if (!existing) isUnique = true;
    } while (!isUnique);

    await SharedBetslip.create({ code, bets });
    socket.emit('betslip_saved', { code });
    console.log(`💾 Betslip saved with unique code: ${code}`);
  });

  socket.on('load_betslip', async ({ code }) => {
    const entry = await SharedBetslip.findOne({ code: code.toUpperCase() });
    if (entry) {
      socket.emit('betslip_loaded', { bets: entry.bets });
    } else {
      socket.emit('betslip_error', { message: `No betslip found for code: ${code}` });
    }
  });

  // ── Place bet ────────────────────────────────────────────────
  socket.on('place_bet', async ({ bets, stake }) => {
    if (!checkRateLimit(socket.id, 'place_bet', 3, 5000)) {
      return socket.emit('bet_error', { message: 'Too many bets placed quickly. Please wait.' });
    }

    // Payload validation
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0 || stakeNum > 10000000) {
      return socket.emit('bet_error', { message: 'Invalid stake amount.' });
    }
    if (!Array.isArray(bets) || bets.length === 0 || bets.length > 50) {
      return socket.emit('bet_error', { message: 'Invalid bet selection.' });
    }
    
    // Validate each bet has valid odds
    const isValid = bets.every(b => b && typeof b.odds === 'number' && b.odds >= 1.01);
    if (!isValid) return socket.emit('bet_error', { message: 'Invalid odds detected in betslip.' });

    const totalOdds = bets.reduce((acc, b) => acc * b.odds, 1);
    const possibleWin = parseFloat((totalOdds * stakeNum).toFixed(2));
    const ticketRef = 'BET-' + Date.now();

    // Deduct balance from DB if authenticated user
    if (socket.user) {
      try {
        const dbUser = await User.findById(socket.user.userId);
        if (!dbUser || dbUser.balance < stakeNum) {
          return socket.emit('bet_error', { message: 'Insufficient balance.' });
        }
        await User.findByIdAndUpdate(socket.user.userId, { $inc: { balance: -stakeNum, totalBets: 1 } });
        await Transaction.create({ userId: dbUser._id, phone: dbUser.phone, type: 'bet_stake', amount: stakeNum, ref: ticketRef });
        // Notify client of updated balance
        socket.emit('balance_update', { balance: dbUser.balance - stakeNum });
      } catch (err) {
        console.error('DB Error deducting balance:', err);
      }
    }

    // Save bet to MongoDB
    try {
      await Bet.create({
        ticketRef,
        userId: socket.user?.userId || null,
        phone: socket.user?.phone || 'guest',
        stake: stakeNum,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        possibleWin,
        bets,
        status: 'Pending',
      });
    } catch (err) {
      console.error('DB Error placing bet:', err);
    }
    
    socket.emit('bet_confirmed', { ticketRef, totalOdds: totalOdds.toFixed(2), possibleWin, stake: stakeNum });
    
    // Update admin stats
    adminStats.totalBets += 1;
    adminStats.totalStaked += stakeNum;
    adminStats.betsLog = [{ ticketRef, stake: stakeNum, possibleWin, time: new Date().toISOString(), status: 'Pending' }, ...adminStats.betsLog].slice(0, 50);
    
    // Grow jackpot pool
    jackpotPool.current = Math.min(jackpotPool.target, jackpotPool.current + stakeNum * 0.05);
    io.emit('jackpot_pool_update', jackpotPool);
    io.to('admins').emit('admin_stats', adminStats);
    
    console.log(`🎟️  Bet placed ${ticketRef} | Stake: ${stakeNum} | Win: ${possibleWin}`);
  });

  socket.on('disconnect', () => {
    delete aviator.players[socket.id];
    adminStats.activeUsers = Math.max(0, adminStats.activeUsers - 1);
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // ── Aviator: place bet during BETTING phase ───────────────────
  socket.on('aviator_place_bet', ({ stake, autoCashout }) => {
    if (!checkRateLimit(socket.id, 'aviator_bet', 3, 5000)) {
      return socket.emit('aviator_error', { message: 'Too many bets. Please wait.' });
    }
    
    if (aviator.phase !== 'betting') {
      socket.emit('aviator_error', { message: 'Betting is closed for this round.' });
      return;
    }
    
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0 || stakeNum > 1000000) {
      return socket.emit('aviator_error', { message: 'Invalid stake amount.' });
    }
    
    aviator.players[socket.id] = {
      stake: stakeNum,
      autoCashout: autoCashout ? parseFloat(autoCashout) : null,
      cashedOut: false,
      cashoutMultiplier: null,
    };
    socket.emit('aviator_bet_placed', { stake: stakeNum, autoCashout });
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

// Twilio Setup
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

app.post('/api/auth/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ ok: false, error: 'Phone number is required' });
  
  if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    // Mock for local dev without credentials
    console.log(`[Mock SMS] Sending OTP to ${phone}`);
    return res.json({ ok: true, message: 'Mock OTP sent (check console)' });
  }

  try {
    const verification = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phone, channel: 'sms' });
    res.json({ ok: true, status: verification.status });
  } catch (error) {
    console.error('Twilio Error (send):', error);
    res.status(500).json({ ok: false, error: 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code, name, countryId } = req.body;
  if (!phone || !code) return res.status(400).json({ ok: false, error: 'Phone and code are required' });

  const approved = (() => {
    if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) return code === '123456';
    return null; // handled async below
  })();

  const issueToken = async () => {
    // Upsert user in DB
    const role = phone === ADMIN_PHONE ? 'admin' : 'user';
    const user = await User.findOneAndUpdate(
      { phone },
      { $setOnInsert: { phone, name: name || '', role, countryId: countryId || 'KE', balance: 0 } },
      { upsert: true, new: true }
    );
    const token = signToken(user);
    return res.json({ ok: true, status: 'approved', token, user: { phone: user.phone, name: user.name, role: user.role, balance: user.balance, countryId: user.countryId } });
  };

  if (approved === true) return issueToken();
  if (approved === false) return res.status(400).json({ ok: false, error: 'Invalid code (mock requires 123456)' });

  // Real Twilio check
  try {
    const verificationCheck = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    if (verificationCheck.status === 'approved') {
      return issueToken();
    }
    res.status(400).json({ ok: false, error: 'Invalid or expired code' });
  } catch (error) {
    console.error('Twilio Error (verify):', error);
    res.status(500).json({ ok: false, error: 'Failed to verify OTP' });
  }
});

// Get current user profile + balance (JWT protected)
app.get('/api/user/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ ok: false, error: 'No token' });
  const decoded = verifyToken(authHeader.replace('Bearer ', ''));
  if (!decoded) return res.status(401).json({ ok: false, error: 'Invalid token' });
  try {
    const user = await User.findById(decoded.userId).lean();
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    res.json({ ok: true, user: { phone: user.phone, name: user.name, role: user.role, balance: user.balance, countryId: user.countryId, totalWon: user.totalWon } });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Credit balance after deposit (in real app, verify M-Pesa callback here)
app.post('/api/deposit', async (req, res) => {
  const { amount, phone, method } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ ok: false, error: 'Invalid amount' });
  try {
    const user = await User.findOneAndUpdate({ phone }, { $inc: { balance: parseFloat(amount) } }, { new: true });
    if (user) await Transaction.create({ userId: user._id, phone, type: 'deposit', amount: parseFloat(amount), ref: 'DEP-' + Date.now() });
  } catch (err) { console.error('Deposit DB error:', err); }
  res.json({ ok: true, ref: 'DEP-' + Date.now(), amount, method: method || 'M-Pesa', message: 'STK push sent to ' + phone });
});

// Leaderboard — real top winners from DB every 30 seconds, fallback to random if empty
const LEADERBOARD_GAMES = ['Jackpot', 'Aviator', 'Virtual Champions', 'Casino', 'Crash', 'Virtual World Cup', 'BetsWal Fasta'];
const COUNTRY_FLAGS = { KE: '🇰🇪', NG: '🇳🇬', GH: '🇬🇭', ZA: '🇿🇦', UG: '🇺🇬', TZ: '🇹🇿' };
const refreshLeaderboard = async () => {
  try {
    const topUsers = await User.find({ totalWon: { $gt: 0 } }).sort({ totalWon: -1 }).limit(5).lean();
    if (topUsers.length > 0) {
      leaderboard = topUsers.map(u => ({
        phone: u.phone.replace(/^(\d{2})(\d+)(\d{2})$/, (_, a, m, b) => a + '*'.repeat(m.length) + b),
        amount: u.totalWon,
        game: LEADERBOARD_GAMES[Math.floor(Math.random() * LEADERBOARD_GAMES.length)],
        flag: COUNTRY_FLAGS[u.countryId] || '🌍',
      }));
    }
    // If no real winners yet, keep existing (static seed)
  } catch (err) {
    console.error('Leaderboard refresh error:', err.message);
  }
  io.emit('leaderboard_update', leaderboard);
};
setInterval(refreshLeaderboard, 30000);

// Admin stats heartbeat every 5s (only to admins)
setInterval(() => {
  adminStats.activeUsers = io.engine.clientsCount;
  io.to('admins').emit('admin_stats', adminStats);
}, 5000);

// Serve React frontend (dist folder)
app.use(express.static(path.join(__dirname, '../dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;

// Self-ping to prevent sleep on free hosting (e.g. Render, Heroku)
// Set PUBLIC_URL or SELF_PING_URL environment variables in your hosting provider
const PING_URL = process.env.PUBLIC_URL || process.env.SELF_PING_URL || `http://localhost:${PORT}/health`;
const pingLib = PING_URL.startsWith('https') ? require('https') : require('http');

setInterval(() => {
  pingLib.get(PING_URL, (res) => {
    console.log(`[Self-Ping] Successfully pinged ${PING_URL} - Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[Self-Ping] Error pinging ${PING_URL}:`, err.message);
  });
}, 14 * 60 * 1000); // 14 minutes

server.listen(PORT, () => {
  console.log(`🟢 BetsWal WebSocket server on port ${PORT}`);
  console.log(`   Events: live_match_update | live_count_update | highlight_update | jackpot_update | aviator_tick | aviator_crashed`);
  console.log(`   Client events: save_betslip | load_betslip | place_bet | aviator_place_bet | aviator_cashout`);
});


import React, { useState, useEffect, useRef } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { UserProvider, useUser } from './context/UserContext';
import Navbar from './components/Navbar';
import SidebarLeft from './components/SidebarLeft';
import MainContent from './components/MainContent';
import BetslipRight from './components/BetslipRight';
import JackpotModal from './components/JackpotModal';
import BetTracker from './components/BetTracker';

function AppInner() {
  const [bets, setBets] = useState([]);
  const [activeSection, setActiveSection] = useState('Home');
  const [activeSport, setActiveSport] = useState('Soccer');
  const [activeJackpot, setActiveJackpot] = useState(null);
  const { virtualSports } = useSocket();
  const { setMyBets, myBets, user, isExcluded } = useUser();
  const prevBetStatuses = useRef({});

  // ── Push Notifications: request permission on first login ──────────────
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  // ── Push Notifications: fire when bet settles ─────────────────────────
  useEffect(() => {
    myBets.forEach(bet => {
      const prev = prevBetStatuses.current[bet.ticketRef];
      if (prev === 'Pending' && bet.status !== 'Pending' && Notification.permission === 'granted') {
        const icon = bet.status === 'Won' ? '🏆' : '❌';
        new Notification(`${icon} Bet ${bet.status}! — BetsWal`, {
          body: bet.status === 'Won'
            ? `You won ${bet.possibleWin}! Ticket: ${bet.ticketRef}`
            : `Better luck next time. Ticket: ${bet.ticketRef}`,
          icon: '/starbet_logo.png',
        });
      }
      prevBetStatuses.current[bet.ticketRef] = bet.status;
    });
  }, [myBets]);

  // ── Self-exclusion redirect ────────────────────────────────────────────
  useEffect(() => {
    if (isExcluded && activeSection !== 'Home') setActiveSection('Home');
  }, [isExcluded, activeSection]);

  // ── Automatically settle pending bets ────────────────────────────────
  useEffect(() => {
    if (!virtualSports) return;
    setMyBets(prev => {
      if (!prev || prev.length === 0) return prev;
      let changed = false;
      const updated = prev.map(bet => {
        if (bet.status !== 'Pending') return bet;
        let allResolved = true;
        const newSelections = bet.bets.map(selection => {
          if (selection.resultStatus) return selection;
          const vs = virtualSports.find(v => v.id === selection.matchId);
          if (vs && vs.results && vs.results.length > 0) {
            const betTime = new Date(bet.date).getTime();
            const validResult = vs.results.find(r => r.at > betTime);
            if (validResult) {
              const won = validResult.winnerIdx.toString() === selection.type;
              return { ...selection, resultStatus: won ? 'Won' : 'Lost' };
            }
          }
          const age = Date.now() - new Date(bet.date).getTime();
          if (age > 60000 && !vs) {
            return { ...selection, resultStatus: Math.random() > 0.5 ? 'Won' : 'Lost' };
          }
          allResolved = false;
          return selection;
        });
        const isLost = newSelections.some(s => s.resultStatus === 'Lost');
        const isWon  = allResolved && newSelections.every(s => s.resultStatus === 'Won');
        if (isLost || isWon) { changed = true; return { ...bet, bets: newSelections, status: isLost ? 'Lost' : 'Won' }; }
        if (JSON.stringify(newSelections) !== JSON.stringify(bet.bets)) { changed = true; return { ...bet, bets: newSelections }; }
        return bet;
      });
      return changed ? updated : prev;
    });
  }, [virtualSports, setMyBets]);

  const toggleBet = (match, type, oddsValue) => {
    if (isExcluded) return;
    setBets(prev => {
      const existing = prev.find(b => b.matchId === match.id && b.type === type);
      if (existing) return prev.filter(b => !(b.matchId === match.id && b.type === type));
      const filtered = prev.filter(b => b.matchId !== match.id);
      return [...filtered, {
        matchId: match.id, home: match.home, away: match.away, type,
        odds: parseFloat(typeof oddsValue === 'number' ? oddsValue.toFixed(2) : oddsValue),
      }];
    });
  };

  const clearBets = () => setBets([]);
  const removeBet = (id) => setBets(prev => prev.filter(b => b.matchId !== id));

  const sportsLayout = ['Home', 'Live', 'Jackpots', 'Shikisha Bet', 'Aviator',
    'Ligi Bigi', 'Virtuals', 'BetsWal Fasta', 'Betika Fasta', 'Crash Games', 'Upcoming', 'Countries'];
  const isSportsLayout = sportsLayout.some(s => activeSection === s || activeSection.startsWith(s));

  return (
    <>
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} bets={bets} />

      {isSportsLayout ? (
        <div className="app-layout">
          <SidebarLeft activeSport={activeSport} setActiveSport={setActiveSport} setActiveSection={setActiveSection} />
          <MainContent activeSport={activeSport} bets={bets} toggleBet={toggleBet} activeSection={activeSection} setActiveSection={setActiveSection} setActiveJackpot={setActiveJackpot} />
          <div style={{ position: 'sticky', top: '80px', alignSelf: 'start', height: 'max-content' }}>
            <BetslipRight bets={bets} clearBets={clearBets} removeBet={removeBet} />
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
          <MainContent activeSport={activeSport} bets={bets} toggleBet={toggleBet} activeSection={activeSection} setActiveSection={setActiveSection} setActiveJackpot={setActiveJackpot} />
        </div>
      )}

      {activeJackpot && (
        <JackpotModal jackpotKey={activeJackpot} onClose={() => setActiveJackpot(null)} />
      )}

      {/* Floating Bet Tracker (always visible when user has bets) */}
      <BetTracker />
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <AppInner />
      </SocketProvider>
    </UserProvider>
  );
}

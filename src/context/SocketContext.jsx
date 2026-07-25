import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';
let socketInstance = null;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket]               = useState(null);
  const [connected, setConnected]         = useState(false);
  const [liveMatches, setLiveMatches]     = useState([]);
  const [highlights, setHighlights]       = useState([]);
  const [jackpot, setJackpot]             = useState(null);
  const [liveCount, setLiveCount]         = useState(0);
  const [virtualSports, setVirtualSports] = useState([]);
  const [casinoActivity, setCasinoActivity] = useState([]);
  const [fastaMarkets, setFastaMarkets]   = useState([]);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [jackpotPool, setJackpotPool]     = useState({ current: 2_340_000, target: 5_000_000 });
  const [adminStats, setAdminStats]       = useState({ totalBets: 0, totalStaked: 0, activeUsers: 0, betsLog: [] });

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
    }
    const s = socketInstance;
    setSocket(s);

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('live_match_update', setLiveMatches);
    s.on('highlight_update',  setHighlights);
    s.on('jackpot_update',    setJackpot);
    s.on('live_count_update', setLiveCount);
    s.on('virtual_update',    setVirtualSports);
    s.on('casino_activity',   setCasinoActivity);
    s.on('fasta_update',      setFastaMarkets);
    s.on('leaderboard_update', setLeaderboard);
    s.on('jackpot_pool_update', setJackpotPool);
    s.on('admin_stats',       setAdminStats);

    return () => {
      s.off('live_match_update', setLiveMatches);
      s.off('highlight_update',  setHighlights);
      s.off('jackpot_update',    setJackpot);
      s.off('live_count_update', setLiveCount);
      s.off('virtual_update',    setVirtualSports);
      s.off('casino_activity',   setCasinoActivity);
      s.off('fasta_update',      setFastaMarkets);
      s.off('leaderboard_update', setLeaderboard);
      s.off('jackpot_pool_update', setJackpotPool);
      s.off('admin_stats',       setAdminStats);
      s.off('connect');
      s.off('disconnect');
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket, connected,
      liveMatches, highlights, jackpot, liveCount,
      virtualSports, casinoActivity, fastaMarkets,
      leaderboard, jackpotPool, adminStats,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

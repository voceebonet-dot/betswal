import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

// User Context handles session and wallet

// Country definitions with exchange rates relative to KSh (base 1)
export const COUNTRIES = {
  KE: { id: 'KE', name: 'Kenya',        currency: 'KSh', symbol: 'KSh', rate: 1     },
  NG: { id: 'NG', name: 'Nigeria',      currency: 'NGN', symbol: '₦',   rate: 11.5  },
  GH: { id: 'GH', name: 'Ghana',        currency: 'GHS', symbol: 'GH₵', rate: 0.1   },
  ZA: { id: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R',   rate: 0.15  },
  UG: { id: 'UG', name: 'Uganda',       currency: 'UGX', symbol: 'UGX', rate: 29.5  },
  TZ: { id: 'TZ', name: 'Tanzania',     currency: 'TZS', symbol: 'TSh', rate: 20    },
  MW: { id: 'MW', name: 'Malawi',       currency: 'MWK', symbol: 'MK',  rate: 13.3  },
  ZW: { id: 'ZW', name: 'Zimbabwe',     currency: 'ZWG', symbol: 'Z$',  rate: 0.21  },
  ZM: { id: 'ZM', name: 'Zambia',       currency: 'ZMW', symbol: 'K',   rate: 0.21  },
  BW: { id: 'BW', name: 'Botswana',     currency: 'BWP', symbol: 'P',   rate: 0.10  },
  ET: { id: 'ET', name: 'Ethiopia',     currency: 'ETB', symbol: 'Br',  rate: 0.87  },
};


const UserContext = createContext(null);

const load = (key, fallback) => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
};

export const UserProvider = ({ children }) => {
  // ── Country ──────────────────────────────────────────────────────────────
  const [countryCode, setCountryCode] = useState(() => localStorage.getItem('betSiteCountry') || 'KE');
  const country = COUNTRIES[countryCode] || COUNTRIES['KE'];
  useEffect(() => { localStorage.setItem('betSiteCountry', countryCode); }, [countryCode]);
  const changeCountry = (code) => { if (COUNTRIES[code]) setCountryCode(code); };

  const formatCurrency = (baseAmount) => {
    const localAmount = baseAmount * country.rate;
    const maxFractionDigits = (localAmount % 1 === 0 && localAmount > 10) ? 0 : 2;
    return `${country.symbol} ${localAmount.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits })}`;
  };

  // Round a KSh base amount to the nearest clean local denomination
  // e.g. KSh 50 @ 11.5x (NGN) = 575 → rounds to 600
  const getLocalMinStake = (kshBase) => {
    const raw = kshBase * country.rate;
    if (raw < 5)   return Math.ceil(raw);       // sub-5: exact
    if (raw < 50)  return Math.round(raw / 5)  * 5;   // 5-49: round to 5
    if (raw < 500) return Math.round(raw / 10) * 10;  // 50-499: round to 10
    if (raw < 5000) return Math.round(raw / 50) * 50; // 500-4999: round to 50
    return Math.round(raw / 100) * 100;               // 5000+: round to 100
  };

  // ── User Session ─────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => load('betSiteUser', null));
  const [wallet, setWallet] = useState(() => load('betSiteWallet', 0));
  const [transactions, setTransactions] = useState(() => load('betSiteTx', []));

  useEffect(() => { localStorage.setItem('betSiteUser', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('betSiteWallet', JSON.stringify(wallet)); }, [wallet]);
  useEffect(() => { localStorage.setItem('betSiteTx', JSON.stringify(transactions)); }, [transactions]);

  const socketCtx = useSocket();
  const socket = socketCtx?.socket;

  // API Base URL
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

  // ── Rehydrate Session ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    fetch(`${API_URL}/user/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        setUser(data.user);
        // Set balance directly from DB response — this is the source of truth
        setWallet(data.user.balance);
        if (data.user.countryId) setCountryCode(data.user.countryId);
        // Also ask the server via socket for fresh balance (handles socket already connected)
        if (socket && socket.connected) socket.emit('get_balance');
      } else {
        localStorage.removeItem('jwt');
        setUser(null);
      }
    })
    .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const login = async (phone, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem('jwt', data.token);
        setUser(data.user);
        setWallet(data.user.balance);
        if (data.user.countryId) setCountryCode(data.user.countryId);
        
        if (socket) {
          socket.disconnect().connect();
        }
      }
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      return { ok: false, error: 'Network error' };
    }
  };

  const requestOtp = async (phone) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return await res.json();
    } catch (error) {
      console.error('Request OTP Error:', error);
      return { ok: false, error: 'Network error' };
    }
  };

  const register = async (phone, password, name, countryId, referredBy, pinId, otpCode) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name, countryId, referredBy, pinId, otpCode }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem('jwt', data.token);
        setUser(data.user);
        setWallet(data.user.balance);
        if (data.user.countryId) setCountryCode(data.user.countryId);
        
        if (socket) {
          socket.disconnect().connect();
        }
      }
      return data;
    } catch (error) {
      console.error('Register Error:', error);
      return { ok: false, error: 'Network error' };
    }
  };

  const logout = () => { 
    localStorage.removeItem('jwt');
    setUser(null); 
    if (socket) socket.disconnect().connect(); // clear auth state
  };

  // Re-subscribe to admin stats on reload if user is admin
  useEffect(() => {
    if (user?.role === 'admin' && socket) {
      socket.emit('admin_subscribe');
    }
  }, [user, socket]);

  // ── Global Socket Listeners for Admin Actions ───────────────────────────
  useEffect(() => {
    if (!socket || !user) return;
    
    const onWithdrawalApproved = (data) => {
      if (data.phone === user.phone) {
        setWallet(prev => prev - data.amount);
        setTransactions(prev => [{ type: 'withdrawal', amount: data.amount, date: new Date().toISOString(), ref: data.reqId, status: 'Completed' }, ...prev]);
        // Send browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Withdrawal Approved! 💸', { body: `${formatCurrency(data.amount)} has been sent to your account.` });
        }
      }
    };

    const onWithdrawalRejected = (data) => {
      if (data.phone === user.phone) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Withdrawal Rejected ❌', { body: `Your request for ${formatCurrency(data.amount)} was declined.` });
        }
      }
    };

    const onBetSettled = ({ ticketRef, status }) => {
      setMyBets(prev => {
        let changed = false;
        const updated = prev.map(bet => {
          if (bet.ticketRef === ticketRef && bet.status === 'Pending') {
            changed = true;
            if (status === 'Won') {
              creditWinnings(parseFloat(bet.possibleWin), ticketRef);
            }
            return { ...bet, status };
          }
          return bet;
        });
        return changed ? updated : prev;
      });
    };

    const onPromoBroadcast = ({ message }) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('BetsWal Promo 🌟', { body: message, icon: '/starbet_logo.svg' });
      } else {
        alert('BetsWal Promo 🌟\n\n' + message);
      }
    };

    const onBalanceUpdate = ({ balance }) => {
      setWallet(balance);
    };

    const onBalanceUpdateTarget = ({ userId, balance }) => {
      if (user && user.userId === userId) {
        setWallet(balance);
      }
    };

    const onWithdrawalSuccess = ({ message }) => {
      alert(`✅ ${message}`);
    };

    const onWithdrawalError = ({ message }) => {
      alert(`❌ Withdrawal Failed: ${message}`);
    };

    const onDepositSuccess = ({ userId, amount }) => {
      if (user && user.userId === userId) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Deposit Successful! 💳', { body: `KSh ${amount} has been added to your account.` });
        } else {
          alert(`✅ Deposit of KSh ${amount} was successful!`);
        }
      }
    };

    const onDepositFailed = ({ userId, reason }) => {
      if (user && user.userId === userId) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Deposit Failed ❌', { body: reason });
        } else {
          alert(`❌ Deposit Failed: ${reason}`);
        }
      }
    };

    socket.on('withdrawal_approved', onWithdrawalApproved);
    socket.on('withdrawal_rejected', onWithdrawalRejected);
    socket.on('withdrawal_success', onWithdrawalSuccess);
    socket.on('withdrawal_error', onWithdrawalError);
    socket.on('bet_settled', onBetSettled);
    socket.on('promo_broadcast', onPromoBroadcast);
    socket.on('balance_update', onBalanceUpdate);
    socket.on('balance_update_target', onBalanceUpdateTarget);
    socket.on('deposit_success', onDepositSuccess);
    socket.on('deposit_failed', onDepositFailed);

    return () => {
      socket.off('withdrawal_approved', onWithdrawalApproved);
      socket.off('withdrawal_rejected', onWithdrawalRejected);
      socket.off('withdrawal_success', onWithdrawalSuccess);
      socket.off('withdrawal_error', onWithdrawalError);
      socket.off('bet_settled', onBetSettled);
      socket.off('promo_broadcast', onPromoBroadcast);
      socket.off('balance_update', onBalanceUpdate);
      socket.off('balance_update_target', onBalanceUpdateTarget);
      socket.off('deposit_success', onDepositSuccess);
      socket.off('deposit_failed', onDepositFailed);
    };
  }, [socket, user]);

  // ── Wallet ────────────────────────────────────────────────────────────────
  const deposit = async (amount, phone) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return { ok: false, error: 'Invalid amount' };
    try {
      const res = await fetch(`${API_URL}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, phone: phone || user?.phone })
      });
      const data = await res.json();
      if (data.ok) {
        // Balance will be updated automatically via webhook & websocket
        return { ok: true, message: data.message };
      }
      return { ok: false, error: data.error };
    } catch (err) {
      return { ok: false, error: 'Network error' };
    }
  };

  const withdraw = (amount) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return { ok: false, error: 'Invalid amount' };
    if (amt > wallet) return { ok: false, error: 'Insufficient balance' };
    
    // Instead of deducting immediately, request approval
    if (socket) {
      socket.emit('request_withdrawal', { phone: user.phone, amount: amt });
      return { ok: true, pending: true };
    }
    
    // Fallback if no socket (shouldn't happen)
    setWallet(prev => prev - amt);
    setTransactions(prev => [{ type: 'withdrawal', amount: amt, date: new Date().toISOString(), ref: `WDR-${Date.now()}` }, ...prev]);
    return { ok: true };
  };

  const deductStake = (amount) => {
    if (amount > wallet) return { ok: false, error: 'Insufficient balance' };
    // Check spend limits
    if (spendLimit.daily > 0) {
      const todaySpent = transactions
        .filter(t => t.type === 'bet_stake' && t.date.startsWith(new Date().toISOString().split('T')[0]))
        .reduce((sum, t) => sum + t.amount, 0);
      if (todaySpent + amount > spendLimit.daily) {
        return { ok: false, error: `Daily spend limit of ${formatCurrency(spendLimit.daily)} reached` };
      }
    }
    setWallet(prev => prev - amount);
    setTransactions(prev => [{ type: 'bet_stake', amount, date: new Date().toISOString(), ref: `STK-${Date.now()}` }, ...prev]);
    return { ok: true };
  };

  const creditWinnings = (amount, ticketRef) => {
    setWallet(prev => prev + amount);
    setTransactions(prev => [{ type: 'winnings', amount, date: new Date().toISOString(), ref: ticketRef }, ...prev]);
  };

  // ── Responsible Gambling ──────────────────────────────────────────────────
  const [spendLimit, setSpendLimit] = useState(() => load('betSiteSpendLimit', { daily: 0, weekly: 0 }));
  const [selfExclusion, setSelfExclusion] = useState(() => load('betSiteSelfExclusion', null));
  const [realityCheck, setRealityCheck] = useState(() => load('betSiteRealityCheck', 0)); // minutes, 0 = off

  useEffect(() => { localStorage.setItem('betSiteSpendLimit', JSON.stringify(spendLimit)); }, [spendLimit]);
  useEffect(() => { localStorage.setItem('betSiteSelfExclusion', JSON.stringify(selfExclusion)); }, [selfExclusion]);
  useEffect(() => { localStorage.setItem('betSiteRealityCheck', JSON.stringify(realityCheck)); }, [realityCheck]);

  const isExcluded = selfExclusion && new Date(selfExclusion) > new Date();

  const setDailyLimit = (amount) => setSpendLimit(prev => ({ ...prev, daily: parseFloat(amount) || 0 }));
  const setWeeklyLimit = (amount) => setSpendLimit(prev => ({ ...prev, weekly: parseFloat(amount) || 0 }));

  const excludeSelf = (days) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    setSelfExclusion(until.toISOString());
    logout();
  };

  // ── My Bets ───────────────────────────────────────────────────────────────
  const [myBets, setMyBets] = useState(() => load('betSiteMyBets', []));
  useEffect(() => { localStorage.setItem('betSiteMyBets', JSON.stringify(myBets)); }, [myBets]);

  const addBetToHistory = (ticketRef, bets, totalOdds, stake, possibleWin) => {
    setMyBets(prev => [{ ticketRef, bets, totalOdds, stake, possibleWin, status: 'Pending', date: new Date().toISOString() }, ...prev]);
  };

  return (
    <UserContext.Provider
      value={{
        country, changeCountry, formatCurrency, getLocalMinStake,
        user, logout, login, register, requestOtp,
        wallet, deposit, withdraw, deductStake, transactions, creditWinnings,
        myBets, setMyBets, addBetToHistory,
        spendLimit, setSpendLimit, setDailyLimit, setWeeklyLimit,
        selfExclusion, setSelfExclusion, isExcluded, excludeSelf,
        realityCheck, setRealityCheck
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

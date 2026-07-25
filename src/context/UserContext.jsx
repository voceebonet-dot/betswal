import React, { createContext, useContext, useState, useEffect } from 'react';

// Country definitions with exchange rates relative to KSh (base 1)
export const COUNTRIES = {
  KE: { id: 'KE', name: 'Kenya',        currency: 'KSh', symbol: 'KSh', rate: 1 },
  NG: { id: 'NG', name: 'Nigeria',      currency: 'NGN', symbol: '₦',   rate: 11.5 },
  GH: { id: 'GH', name: 'Ghana',        currency: 'GHS', symbol: 'GH₵', rate: 0.1 },
  ZA: { id: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R',   rate: 0.15 },
  UG: { id: 'UG', name: 'Uganda',       currency: 'UGX', symbol: 'UGX', rate: 29.5 },
  TZ: { id: 'TZ', name: 'Tanzania',     currency: 'TZS', symbol: 'TSh', rate: 20 },
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

  // ── User Session ─────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => load('betSiteUser', null));
  const [wallet, setWallet] = useState(() => load('betSiteWallet', 0));
  const [transactions, setTransactions] = useState(() => load('betSiteTx', []));

  useEffect(() => { localStorage.setItem('betSiteUser', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('betSiteWallet', JSON.stringify(wallet)); }, [wallet]);
  useEffect(() => { localStorage.setItem('betSiteTx', JSON.stringify(transactions)); }, [transactions]);

  // Simulated registered users pool (in real app this would be a server call)
  const getRegistered = () => load('betSiteRegistered', []);
  const saveRegistered = (list) => localStorage.setItem('betSiteRegistered', JSON.stringify(list));

  const register = (name, phone, password, countryId) => {
    const list = getRegistered();
    if (list.find(u => u.phone === phone)) return { ok: false, error: 'Phone already registered' };
    const newUser = { id: Date.now(), name, phone, password, countryId, isAdmin: phone === '0000000000', joinedAt: new Date().toISOString() };
    saveRegistered([...list, newUser]);
    setUser(newUser);
    setWallet(0);
    if (countryId) setCountryCode(countryId);
    return { ok: true };
  };

  const login = (phone, password) => {
    // Admin shortcut
    if (phone === '0000000000' && password === 'admin') {
      const adminUser = { id: 0, name: 'Admin', phone, isAdmin: true };
      setUser(adminUser);
      return { ok: true };
    }
    const list = getRegistered();
    const found = list.find(u => u.phone === phone && u.password === password);
    if (!found) return { ok: false, error: 'Invalid phone or password' };
    setUser(found);
    if (found.countryId) setCountryCode(found.countryId);
    return { ok: true };
  };

  const logout = () => { setUser(null); };

  // ── Wallet ────────────────────────────────────────────────────────────────
  const deposit = (amount) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return { ok: false, error: 'Invalid amount' };
    setWallet(prev => prev + amt);
    setTransactions(prev => [{ type: 'deposit', amount: amt, date: new Date().toISOString(), ref: `DEP-${Date.now()}` }, ...prev]);
    return { ok: true };
  };

  const withdraw = (amount) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return { ok: false, error: 'Invalid amount' };
    if (amt > wallet) return { ok: false, error: 'Insufficient balance' };
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
    <UserContext.Provider value={{
      // Country
      country, changeCountry, formatCurrency,
      // User
      user, login, logout, register,
      // Wallet
      wallet, deposit, withdraw, deductStake, creditWinnings, transactions,
      // Responsible Gambling
      spendLimit, setDailyLimit, setWeeklyLimit,
      selfExclusion, excludeSelf, isExcluded,
      realityCheck, setRealityCheck,
      // Bets
      myBets, addBetToHistory, setMyBets,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const NAV_LINKS = [
  { label: 'Home',          section: 'Home' },
  { label: 'Live',          section: 'Live',         liveCount: true },
  { label: 'Jackpots',      section: 'Jackpots' },
  { label: 'Shikisha Bet',  section: 'Shikisha Bet' },
  { label: 'Aviator',       section: 'Aviator',      aviator: true },
  { label: 'Ligi Bigi',     section: 'Ligi Bigi',    badge: true },
  { label: 'Casino',        section: 'Casino',       badge: true },
  { label: 'Promotions',    section: 'Promotions' },
  { label: 'Virtuals',      section: 'Virtuals',     badge: true },
  { label: 'BetsWal Fasta', section: 'BetsWal Fasta', badge: true },
  { label: 'Crash Games',   section: 'Crash Games',  badge: true },
  { label: 'Live Score',    section: 'Live Score' },
  { label: 'App',           section: 'App' },
];

const Navbar = ({ activeSection, setActiveSection }) => {
  const { connected, liveCount } = useSocket();
  const { user, wallet, logout, formatCurrency } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getLabel = (link) => {
    if (link.liveCount) return `Live (${liveCount || 144})`;
    if (link.label === 'Promotions') return 'Promotions (14)';
    return link.label;
  };

  const handleNav = (section) => {
    setActiveSection(section);
    setDropdownOpen(false);
  };

  return (
    <div className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* ── Top header bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', borderBottom: '1px solid rgba(255,255,255,0.02)', height: '56px' }}>
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div style={{ fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)', userSelect: 'none' }} onClick={() => handleNav('Home')}>≡</div>
          <div onClick={() => handleNav('Home')} style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', letterSpacing: '-0.5px', userSelect: 'none' }}>
            <img src="/starbet_logo.png" alt="BetsWal Logo" style={{ width: '34px', height: '34px', borderRadius: '50%', boxShadow: '0 0 14px rgba(254,205,8,0.5)', border: '2px solid rgba(254,205,8,0.3)' }} />
            <span style={{ color: '#fecd08', textShadow: '0 0 12px rgba(254,205,8,0.4)' }}>Bets</span><span style={{ color: '#86c439', textShadow: '0 0 12px rgba(134,196,57,0.4)' }}>Wal</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: connected ? '#28a745' : '#dc3545', background: connected ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${connected ? 'rgba(40,167,69,0.3)' : 'rgba(220,53,69,0.3)'}` }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: connected ? '#28a745' : '#dc3545', display: 'inline-block', boxShadow: `0 0 6px ${connected ? '#28a745' : '#dc3545'}` }} />
            {connected ? 'Live' : 'Offline'}
          </div>

          {user ? (
            /* ── Logged-in account controls ── */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Wallet badge */}
              <div
                onClick={() => handleNav('Deposit')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(134,196,57,0.12)', border: '1px solid rgba(134,196,57,0.3)', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(134,196,57,0.22)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(134,196,57,0.12)'}
              >
                <span style={{ fontSize: '14px' }}>💰</span>
                <span style={{ color: '#86c439', fontWeight: 700, fontSize: '14px' }}>{formatCurrency(wallet)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>+ Deposit</span>
              </div>

              {/* Avatar / dropdown */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setDropdownOpen(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: 'var(--bg-btn)', borderRadius: '20px', padding: '5px 12px', border: '1px solid var(--border-color)' }}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#fecd08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: '#000' }}>
                    {user.name ? user.name[0].toUpperCase() : '?'}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-main)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.phone}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
                </div>

                {dropdownOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', backgroundColor: '#17212b', border: '1px solid var(--border-color)', borderRadius: '10px', minWidth: '180px', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                    {[
                      { icon: '👤', label: 'My Account',     section: 'Account' },
                      { icon: '💳', label: 'Deposit',         section: 'Deposit' },
                      { icon: '💸', label: 'Withdraw',        section: 'Withdraw' },
                      { icon: '🎟️', label: 'My Bets',        section: null, action: 'mybets' },
                      { icon: '🛡️', label: 'Responsible Play', section: 'Responsible' },
                      ...(user.isAdmin ? [{ icon: '⚙️', label: 'Admin Panel', section: 'Admin' }] : []),
                    ].map(item => (
                      <div
                        key={item.label}
                        onClick={() => { item.section ? handleNav(item.section) : setDropdownOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: 'var(--text-main)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>{item.icon}</span>{item.label}
                      </div>
                    ))}
                    <div
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#dc3545', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(220,53,69,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>🚪</span> Logout
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Guest controls ── */
            <>
              <span
                style={{ color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => handleNav('Login')}
              >Login</span>
              <button
                className="btn btn-primary pulse-btn"
                style={{ padding: '6px 16px', border: '1px solid rgba(134,196,57,0.4)', boxShadow: '0 0 10px rgba(134,196,57,0.2)' }}
                onClick={() => handleNav('Register')}
              >Register</button>
            </>
          )}
          <div style={{ cursor: 'pointer', fontSize: '20px', color: '#fecd08', marginLeft: '4px' }}>☀️</div>
        </div>
      </div>

      {/* ── Main nav row ─────────────────────────────────────────── */}
      <nav style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <ul className="flex items-center gap-4" style={{ listStyle: 'none', whiteSpace: 'nowrap', margin: 0, padding: 0 }}>
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.section;
            return (
              <li
                key={link.section}
                className="nav-item"
                onClick={() => handleNav(link.section)}
                style={{
                  color: link.aviator ? (isActive ? '#fecd08' : '#fecd08aa') : isActive ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: isActive ? `2px solid ${link.aviator ? '#fecd08' : 'var(--primary)'}` : '2px solid transparent',
                  padding: '14px 2px', cursor: 'pointer',
                  fontWeight: link.aviator ? 700 : isActive ? 600 : 400,
                  position: 'relative', transition: 'all 0.25s ease', userSelect: 'none',
                  textShadow: isActive && link.aviator ? '0 0 8px rgba(254,205,8,0.5)' : isActive ? '0 0 8px rgba(134,196,57,0.4)' : 'none',
                }}
              >
                {getLabel(link)}
                {link.badge && (
                  <span style={{ position: 'absolute', top: '6px', right: '-14px', background: 'linear-gradient(135deg, #d32f2f, #ff5252)', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 800, letterSpacing: '0.3px' }}>NEW</span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4" style={{ fontWeight: 500, minWidth: '100px', flexShrink: 0 }}>
          <div style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(134,196,57,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
            🔍 <span style={{ fontSize: '12px' }}>Search</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

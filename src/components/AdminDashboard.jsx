import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const TABS = ['Overview', 'Bets', 'Withdrawals', 'Jackpot', 'Users', 'Chat', 'Revenue'];

const AdminDashboard = () => {
  const { user, formatCurrency } = useUser();
  const socketCtx = useSocket();
  const socket = socketCtx?.socket;
  const { adminStats, jackpotPool } = socketCtx || {};

  const [activeTab, setActiveTab] = useState('Overview');
  const [promoMessage, setPromoMessage] = useState('');
  const [jackpotTarget, setJackpotTarget] = useState(jackpotPool?.target || 5000000);
  const [jackpotCurrent, setJackpotCurrent] = useState(jackpotPool?.current || 2340000);

  // Users tab state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [balanceEdits, setBalanceEdits] = useState({}); // userId -> amount
  const [balanceMsg, setBalanceMsg] = useState('');

  // Jackpot tab state
  const [jackpotTickets, setJackpotTickets] = useState([]);

  // Chat tab state
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);

  if (user?.role !== 'admin') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#dc3545' }}>
        <h2>Unauthorized</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const stats = adminStats || { totalBets: 0, totalStaked: 0, activeUsers: 0, betsLog: [], pendingWithdrawals: [] };

  const handleSettle = (ticketRef, status) => {
    if (socket) socket.emit('admin_settle_bet', { ticketRef, status });
  };

  const handleWithdrawal = (reqId, action) => {
    if (socket) socket.emit(action === 'Approve' ? 'approve_withdrawal' : 'reject_withdrawal', { reqId });
  };

  const handleBroadcast = () => {
    if (!promoMessage.trim()) return;
    if (socket) socket.emit('admin_promo_broadcast', { message: promoMessage });
    setPromoMessage('');
  };

  const handleUpdateJackpot = () => {
    if (socket) socket.emit('admin_update_jackpot', { current: jackpotCurrent, target: jackpotTarget });
  };

  const fetchUsers = () => {
    if (socket) socket.emit('admin_get_users', { search: userSearch });
  };

  const fetchJackpotTickets = () => {
    if (socket) socket.emit('admin_get_jackpot_tickets', {});
  };

  useEffect(() => {
    if (!socket) return;
    const onUsersList = (list) => setUsers(list);
    const onJackpotTickets = (tickets) => setJackpotTickets(tickets);
    const onBalanceUpdated = ({ phone, balance, reason }) => {
      setBalanceMsg(`✅ Updated ${phone}: new balance ${formatCurrency(balance)}${reason ? ` (${reason})` : ''}`);
      setTimeout(() => setBalanceMsg(''), 4000);
      fetchUsers(); // Refresh list
    };
    const onChatHistory = (history) => setChatHistory(history);
    const onChatMessage = (msg) => setChatHistory(prev => [...prev, msg]);

    socket.on('admin_users_list', onUsersList);
    socket.on('admin_jackpot_tickets', onJackpotTickets);
    socket.on('admin_balance_updated', onBalanceUpdated);
    socket.on('admin_chat_history', onChatHistory);
    socket.on('admin_chat_message', onChatMessage);
    return () => {
      socket.off('admin_users_list', onUsersList);
      socket.off('admin_jackpot_tickets', onJackpotTickets);
      socket.off('admin_balance_updated', onBalanceUpdated);
      socket.off('admin_chat_history', onChatHistory);
      socket.off('admin_chat_message', onChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (activeTab === 'Users') fetchUsers();
    if (activeTab === 'Jackpot') fetchJackpotTickets();
  }, [activeTab, socket]);

  const handleUpdateBalance = (u) => {
    const amt = parseFloat(balanceEdits[u.id] || 0);
    if (!amt || isNaN(amt)) return;
    if (socket) socket.emit('admin_update_balance', { userId: u.id, amount: amt, reason: 'Admin adjustment' });
    setBalanceEdits(prev => ({ ...prev, [u.id]: '' }));
  };

  const handleMakeAdmin = (u) => {
    if (window.confirm(`Are you sure you want to promote ${u.phone} to Admin?`)) {
      if (socket) socket.emit('admin_make_admin', { userId: u.id });
    }
  };

  const handleSettleJackpot = (ticketRef, status) => {
    if (socket) socket.emit('admin_settle_jackpot', { ticketRef, status });
    setJackpotTickets(prev => prev.filter(t => t.ticketRef !== ticketRef));
  };

  const handleAdminChatReply = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;
    if (socket) socket.emit('admin_chat_reply', { userId: activeChatUser, text: chatInput.trim() });
    setChatInput('');
  };

  // Group chats by user
  const chatUsers = [...new Set(chatHistory.filter(m => m.sender !== 'admin').map(m => m.userId))];

  const tabStyle = (tab) => ({
    padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
    background: 'none', border: 'none', transition: 'all 0.2s',
  });

  return (
    <div style={{ padding: '1rem 0' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>🛡️ Admin Control Center</h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Active Users', value: stats.activeUsers, color: '#28a745' },
          { label: 'Total Bets', value: stats.totalBets, color: '#fecd08' },
          { label: 'Total Staked', value: formatCurrency(stats.totalStaked), color: '#86c439' },
          { label: 'Jackpot Pool', value: formatCurrency(jackpotPool?.current || 0), color: '#fecd08', sub: `Target: ${formatCurrency(jackpotPool?.target || 0)}` },
          { label: 'Pending Withdrawals', value: stats.pendingWithdrawals?.length || 0, color: '#ffc107' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            {kpi.sub && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>📢 Global Promo Broadcast</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. Flash Promo! Deposit now for 20% bonus..."
                value={promoMessage}
                onChange={e => setPromoMessage(e.target.value)}
                style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
              />
              <button className="btn btn-primary" onClick={handleBroadcast}>Send</button>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>🎰 Override Jackpot Pool</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Amount</label>
                <input type="number" value={jackpotCurrent} onChange={e => setJackpotCurrent(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Amount</label>
                <input type="number" value={jackpotTarget} onChange={e => setJackpotTarget(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn" style={{ padding: '8px 12px', backgroundColor: '#86c439', color: '#000' }} onClick={handleUpdateJackpot}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BETS TAB ── */}
      {activeTab === 'Bets' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🎯 Live Bets Log</h3>
          {stats.betsLog && stats.betsLog.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Time</th>
                    <th style={{ padding: '10px' }}>Ticket Ref</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Stake</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Potential Win</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Settle</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.betsLog.map((bet, i) => {
                    const isBigWin = parseFloat(bet.possibleWin) > parseFloat(bet.stake) * 10;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{new Date(bet.time).toLocaleTimeString()}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#fecd08' }}>{bet.ticketRef}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(bet.stake)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: isBigWin ? '#86c439' : 'var(--text-main)' }}>
                          {formatCurrency(bet.possibleWin)}{isBigWin && <span style={{ marginLeft: '5px' }}>🚀</span>}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {bet.status === 'Pending' ? (
                            <>
                              <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#86c439', color: '#000', marginRight: '5px' }} onClick={() => handleSettle(bet.ticketRef, 'Won')}>✅ Won</button>
                              <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: '#fff' }} onClick={() => handleSettle(bet.ticketRef, 'Lost')}>❌ Lost</button>
                            </>
                          ) : (
                            <span style={{ color: bet.status === 'Won' ? '#86c439' : '#dc3545', fontWeight: 700 }}>{bet.status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No bets yet.</div>
          )}
        </div>
      )}

      {/* ── WITHDRAWALS TAB ── */}
      {activeTab === 'Withdrawals' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#ffc107' }}>⏳ Pending Withdrawals</h3>
          {stats.pendingWithdrawals && stats.pendingWithdrawals.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Req ID</th>
                    <th style={{ padding: '10px' }}>Phone</th>
                    <th style={{ padding: '10px' }}>Time</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingWithdrawals.map((req, i) => (
                    <tr key={req.reqId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#fecd08' }}>{req.reqId}</td>
                      <td style={{ padding: '10px' }}>{req.phone}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(req.time).toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(req.amount)}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#28a745', marginRight: '5px' }} onClick={() => handleWithdrawal(req.reqId, 'Approve')}>✅ Approve</button>
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545' }} onClick={() => handleWithdrawal(req.reqId, 'Reject')}>❌ Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No pending withdrawals.</div>
          )}
        </div>
      )}

      {/* ── JACKPOT TAB ── */}
      {activeTab === 'Jackpot' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>🎰 Jackpot Tickets (Pending)</h3>
            <button className="btn" style={{ padding: '6px 14px', backgroundColor: 'var(--primary)', color: '#000', fontWeight: 700 }} onClick={fetchJackpotTickets}>🔄 Refresh</button>
          </div>
          {jackpotTickets.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Ticket Ref</th>
                    <th style={{ padding: '10px' }}>Phone</th>
                    <th style={{ padding: '10px' }}>Jackpot</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Stake</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Settle</th>
                  </tr>
                </thead>
                <tbody>
                  {jackpotTickets.map((t, i) => (
                    <tr key={t.ticketRef} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#fecd08' }}>{t.ticketRef}</td>
                      <td style={{ padding: '10px' }}>{t.phone}</td>
                      <td style={{ padding: '10px' }}>{t.jackpotName}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(t.stake)}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#86c439', color: '#000', marginRight: '5px' }} onClick={() => handleSettleJackpot(t.ticketRef, 'Won')}>🏆 Won</button>
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: '#fff' }} onClick={() => handleSettleJackpot(t.ticketRef, 'Lost')}>❌ Lost</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No pending jackpot tickets.</div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'Users' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>👥 User Management</h3>
          {balanceMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', backgroundColor: 'rgba(40,167,69,0.15)', border: '1px solid #28a745', color: '#fff', fontWeight: 600, fontSize: '13px' }}>
              {balanceMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Search by phone number..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
            />
            <button className="btn btn-primary" onClick={fetchUsers}>Search</button>
          </div>
          {users.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Phone</th>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Balance</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Total Won</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Bets</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{u.phone}{u.role === 'admin' && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#fecd08', background: 'rgba(254,205,8,0.15)', borderRadius: '4px', padding: '1px 5px' }}>admin</span>}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{u.name || '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(u.balance)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#86c439' }}>{formatCurrency(u.totalWon)}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{u.totalBets}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <input
                              type="number"
                              placeholder="±amt"
                              value={balanceEdits[u.id] || ''}
                              onChange={e => setBalanceEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                              style={{ width: '60px', padding: '5px 4px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                            />
                            <button className="btn" style={{ padding: '5px 8px', backgroundColor: '#3498db', color: '#fff', fontSize: '11px', fontWeight: 700 }} onClick={() => handleUpdateBalance(u)}>Apply</button>
                          </div>
                          {u.role !== 'admin' && (
                            <button className="btn" style={{ padding: '5px 8px', backgroundColor: '#8e44ad', color: '#fff', fontSize: '11px', fontWeight: 700 }} onClick={() => handleMakeAdmin(u)}>Make Admin</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {userSearch ? 'No users found.' : 'Click Search to load users.'}
            </div>
          )}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {activeTab === 'Chat' && (
        <div className="glass-panel" style={{ display: 'flex', height: '60vh', overflow: 'hidden' }}>
          {/* User List */}
          <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
            <div style={{ padding: '16px', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Active Chats</div>
            {chatUsers.map(uid => {
              const lastMsg = chatHistory.filter(m => m.userId === uid).pop();
              return (
                <div 
                  key={uid} 
                  onClick={() => setActiveChatUser(uid)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    background: activeChatUser === uid ? 'rgba(134,196,57,0.1)' : 'transparent',
                    borderLeft: activeChatUser === uid ? '4px solid var(--primary)' : '4px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>User {uid.substring(0, 6)}...</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastMsg?.text}</div>
                </div>
              );
            })}
            {chatUsers.length === 0 && <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>No active chats.</div>}
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
            {activeChatUser ? (
              <>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Chatting with User {activeChatUser}
                </div>
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatHistory.filter(m => m.userId === activeChatUser).map((msg, i) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          background: isAdmin ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                          color: isAdmin ? '#000' : '#fff',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          borderBottomRightRadius: isAdmin ? '2px' : '12px',
                          borderBottomLeftRadius: !isAdmin ? '2px' : '12px',
                          maxWidth: '70%',
                          fontSize: '13px'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleAdminChatReply} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type reply..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff', outline: 'none' }} />
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '8px' }}>Reply</button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select a user to start chatting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVENUE TAB ── */}
      {activeTab === 'Revenue' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>📈 Revenue Reports</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Deposits</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fecd08' }}>{formatCurrency(stats.totalStaked * 1.5 || 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Payouts</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc3545' }}>{formatCurrency(stats.totalStaked * 0.8 || 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Net Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#28a745' }}>{formatCurrency((stats.totalStaked * 1.5) - (stats.totalStaked * 0.8) || 0)}</div>
            </div>
          </div>

          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Last 7 Days (Simulated)</h4>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            {[0.4, 0.7, 0.5, 0.9, 0.6, 1.0, 0.8].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '100%', height: `${val * 150}px`, background: 'linear-gradient(to top, var(--primary), #00d2ff)', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Day {i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

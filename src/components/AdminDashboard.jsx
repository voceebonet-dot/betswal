import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const AdminDashboard = () => {
  const { user, formatCurrency } = useUser();
  const socketCtx = useSocket();
  const socket = socketCtx?.socket;
  const { adminStats, jackpotPool } = socketCtx || {};

  const [promoMessage, setPromoMessage] = useState('');
  const [jackpotTarget, setJackpotTarget] = useState(jackpotPool?.target || 5000000);
  const [jackpotCurrent, setJackpotCurrent] = useState(jackpotPool?.current || 2340000);

  if (!user?.isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#dc3545' }}>
        <h2>Unauthorized</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Use a fallback just in case socket hasn't populated stats yet
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

  return (
    <div style={{ padding: '1rem 0' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Admin Control Center</h2>
      
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(40,167,69,0.3)', boxShadow: '0 0 15px rgba(40,167,69,0.1)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Active Users (WebSocket)</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#28a745' }}>{stats.activeUsers}</div>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Bets Placed</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fecd08' }}>{stats.totalBets}</div>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Staked</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#86c439' }}>{formatCurrency(stats.totalStaked)}</div>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid rgba(254,205,8,0.3)', boxShadow: '0 0 15px rgba(254,205,8,0.1)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Current Jackpot</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fecd08' }}>{formatCurrency(jackpotPool?.current || 0)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: {formatCurrency(jackpotPool?.target || 0)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Controls: Promo */}
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

        {/* Controls: Jackpot Override */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>🎰 Override Jackpot</h3>
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

      {/* Pending Withdrawals Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#ffc107' }}>⏳ Pending Withdrawals</h3>
        {stats.pendingWithdrawals && stats.pendingWithdrawals.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Req ID</th>
                  <th style={{ padding: '10px' }}>User Phone</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingWithdrawals.map((req, i) => (
                  <tr key={req.reqId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#fecd08' }}>{req.reqId}</td>
                    <td style={{ padding: '10px' }}>{req.phone}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(req.amount)}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#28a745', marginRight: '5px' }} onClick={() => handleWithdrawal(req.reqId, 'Approve')}>Approve</button>
                      <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545' }} onClick={() => handleWithdrawal(req.reqId, 'Reject')}>Reject</button>
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

      {/* Bets Log Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Live Bets Log</h3>
        
        {stats.betsLog && stats.betsLog.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Time</th>
                  <th style={{ padding: '10px' }}>Ticket Ref</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Stake</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Potential Win</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Settle Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.betsLog.map((bet, i) => {
                  const isBigWin = parseFloat(bet.possibleWin) > parseFloat(bet.stake) * 10;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {new Date(bet.time).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#fecd08' }}>
                        {bet.ticketRef}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(bet.stake)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: isBigWin ? '#86c439' : 'var(--text-main)', textShadow: isBigWin ? '0 0 8px rgba(134,196,57,0.5)' : 'none' }}>
                        {formatCurrency(bet.possibleWin)}
                        {isBigWin && <span style={{ marginLeft: '5px' }}>🚀</span>}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {bet.status === 'Pending' ? (
                          <>
                            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#86c439', color: '#000', marginRight: '5px' }} onClick={() => handleSettle(bet.ticketRef, 'Won')}>✅ Won</button>
                            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: '#fff' }} onClick={() => handleSettle(bet.ticketRef, 'Lost')}>❌ Lost</button>
                          </>
                        ) : (
                          <span style={{ color: bet.status === 'Won' ? '#86c439' : '#dc3545', fontWeight: 700 }}>
                            {bet.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Waiting for live bets...
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

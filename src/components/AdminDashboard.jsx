import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const AdminDashboard = () => {
  const { user, formatCurrency } = useUser();
  const { adminStats, jackpotPool } = useSocket();

  if (!user?.isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#dc3545' }}>
        <h2>Unauthorized</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Use a fallback just in case socket hasn't populated stats yet
  const stats = adminStats || { totalBets: 0, totalStaked: 0, activeUsers: 0, betsLog: [] };

  return (
    <div style={{ padding: '1rem 0' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Admin Dashboard</h2>
      
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

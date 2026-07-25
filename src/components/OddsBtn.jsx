import React from 'react';

const OddsBtn = ({ odd, prevOdd, selected, onClick, label }) => {
  const direction = prevOdd == null ? null : odd > prevOdd ? 'up' : odd < prevOdd ? 'down' : null;

  const bg = selected
    ? 'linear-gradient(135deg, var(--primary), #5a9e27)'
    : direction === 'up'   ? 'linear-gradient(135deg, rgba(40,167,69,0.5), rgba(40,167,69,0.3))'
    : direction === 'down' ? 'linear-gradient(135deg, rgba(220,53,69,0.5), rgba(220,53,69,0.3))'
    : 'var(--bg-btn)';

  const border = selected
    ? '1px solid rgba(134,196,57,0.6)'
    : direction === 'up'   ? '1px solid rgba(40,167,69,0.5)'
    : direction === 'down' ? '1px solid rgba(220,53,69,0.5)'
    : '1px solid rgba(255,255,255,0.07)';

  return (
    <button
      className="odds-btn"
      onClick={onClick}
      style={{
        background: bg,
        border,
        color: selected ? '#000' : '#fff',
        position: 'relative',
        transition: 'all 0.25s ease',
        minWidth: '78px',
        borderRadius: '10px',
        boxShadow: selected ? '0 4px 14px rgba(134,196,57,0.35)' : '0 2px 6px rgba(0,0,0,0.2)',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
    >
      <span style={{
        fontSize: '10px',
        color: selected ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
        display: 'block',
        fontWeight: 700,
        letterSpacing: '0.5px',
        marginBottom: '2px',
      }}>
        {label === '1' ? 'HOME' : label === '2' ? 'AWAY' : 'DRAW'}
      </span>
      <span style={{ fontWeight: 800, fontSize: '14px' }}>
        {typeof odd === 'number' ? odd.toFixed(2) : odd}
      </span>
      {!selected && direction && (
        <span style={{
          position: 'absolute', top: '-7px', right: '4px',
          fontSize: '10px',
          color: direction === 'up' ? '#28a745' : '#dc3545',
          fontWeight: 900,
          filter: `drop-shadow(0 0 4px ${direction === 'up' ? '#28a745' : '#dc3545'})`,
        }}>
          {direction === 'up' ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
};

export default OddsBtn;

import React from 'react';

const OddsBtn = ({ odd, prevOdd, selected, onClick, label }) => {
  const direction = prevOdd == null ? null : odd > prevOdd ? 'up' : odd < prevOdd ? 'down' : null;

  let bg = selected ? 'var(--primary)' : 'var(--bg-btn)';
  if (!selected && direction === 'up')   bg = 'rgba(40,167,69,0.55)';
  if (!selected && direction === 'down') bg = 'rgba(220,53,69,0.55)';

  return (
    <button
      className="odds-btn"
      style={{ backgroundColor: bg, color: selected ? '#000' : '#fff', position: 'relative', transition: 'background-color 0.35s ease', minWidth: '78px' }}
      onClick={onClick}
    >
      <span style={{ fontSize: '10px', color: selected ? '#000' : 'var(--text-muted)', display: 'block' }}>{label}</span>
      {typeof odd === 'number' ? odd.toFixed(2) : odd}
      {!selected && direction && (
        <span style={{ position: 'absolute', top: '-6px', right: '-2px', fontSize: '10px', color: direction === 'up' ? '#28a745' : '#dc3545' }}>
          {direction === 'up' ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
};

export default OddsBtn;

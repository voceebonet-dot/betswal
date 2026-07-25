import React from 'react';

const Footer = ({ setActiveSection }) => {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: 'Sports',
      links: [
        { label: 'Soccer', section: 'Home' },
        { label: 'Basketball', section: 'Home' },
        { label: 'Tennis', section: 'Home' },
        { label: 'Cricket', section: 'Home' },
        { label: 'Rugby', section: 'Home' },
      ],
    },
    {
      title: 'Games',
      links: [
        { label: 'Aviator', section: 'Aviator' },
        { label: 'Casino', section: 'Casino' },
        { label: 'Crash Games', section: 'Crash Games' },
        { label: 'Virtuals', section: 'Virtuals' },
        { label: 'Jackpots', section: 'Jackpots' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Register', section: 'Register' },
        { label: 'Login', section: 'Login' },
        { label: 'Deposit', section: 'Deposit' },
        { label: 'Withdraw', section: 'Withdraw' },
        { label: 'My Account', section: 'Account' },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'Promotions', section: 'Promotions' },
        { label: 'Responsible Play', section: 'Responsible' },
        { label: 'Live Score', section: 'Live Score' },
        { label: 'Get the App', section: 'App' },
        { label: 'BetsWal Fasta', section: 'BetsWal Fasta' },
      ],
    },
  ];

  const payments = ['M-Pesa', 'Airtel Money', 'T-Kash', 'Visa', 'Mastercard'];
  const socialLinks = [
    { icon: '𝕏', label: 'Twitter', url: '#' },
    { icon: 'f', label: 'Facebook', url: '#' },
    { icon: '▶', label: 'YouTube', url: '#' },
    { icon: 'in', label: 'Instagram', url: '#' },
  ];

  return (
    <footer style={{
      marginTop: '4rem',
      background: 'linear-gradient(180deg, #0a1118 0%, #060c12 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Top section */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>

        {/* Brand + tagline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img src="/starbet_logo.svg" alt="BetsWal Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', boxShadow: '0 0 16px rgba(254,205,8,0.45)', border: '2px solid rgba(254,205,8,0.3)' }} />
              <span style={{ fontSize: '26px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.5px' }}>
                <span style={{ color: '#fecd08', textShadow: '0 0 12px rgba(254,205,8,0.4)' }}>Bets</span>
                <span style={{ color: '#86c439', textShadow: '0 0 12px rgba(134,196,57,0.4)' }}>Wal</span>
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.7', marginBottom: '16px' }}>
              Africa's premier sports betting and gaming platform. Bet responsibly. 18+ only.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {socialLinks.map(s => (
                <a key={s.label} href={s.url} aria-label={s.label} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 700,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(134,196,57,0.15)'; e.currentTarget.style.color = '#86c439'; e.currentTarget.style.borderColor = 'rgba(134,196,57,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', flex: 1, maxWidth: '700px' }}>
            {columns.map(col => (
              <div key={col.title}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#86c439', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
                  {col.title}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {col.links.map(link => (
                    <li key={link.label}>
                      <button
                        onClick={() => setActiveSection && setActiveSection(link.section)}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'left',
                          transition: 'color 0.2s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Payment Methods
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {payments.map(p => (
              <div key={p} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3px',
              }}>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Responsible gambling + license */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#dc3545', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔞 18+ Only
            </div>
            <div style={{ background: 'rgba(254,205,8,0.08)', border: '1px solid rgba(254,205,8,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#fecd08', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Responsible Gambling
            </div>
            <div style={{ background: 'rgba(134,196,57,0.08)', border: '1px solid rgba(134,196,57,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#86c439', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✅ Licensed & Regulated
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, maxWidth: '380px', textAlign: 'right' }}>
            Betting can be addictive. Please play responsibly. If you need help, call the National Problem Gambling Helpline.
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
            © {year} BetsWal. All rights reserved. BetsWal is operated under a valid gaming license.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <span key={item} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#86c439'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

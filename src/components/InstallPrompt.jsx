import React, { useState, useEffect } from 'react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--bg-panel)',
      border: '1px solid var(--primary)',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 8px 32px rgba(134,196,57,0.2)',
      zIndex: 9999
    }}>
      <div style={{ fontSize: '24px' }}>📱</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Install BetsWal App</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Faster access, full screen.</div>
      </div>
      <button 
        className="btn btn-primary" 
        onClick={handleInstall}
        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
      >
        Install
      </button>
      <button 
        onClick={() => setShowPrompt(false)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
      >
        ×
      </button>
    </div>
  );
};

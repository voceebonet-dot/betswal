import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

export const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const { socket } = useSocket();
  const { user } = useUser();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket || !user) return;

    // Load history when opening chat
    if (isOpen && history.length === 0) {
      socket.emit('chat_history');
    }

    const handleMessage = (msg) => {
      setHistory(prev => [...prev, msg]);
    };
    const handleHistory = (msgs) => {
      setHistory(msgs);
    };

    socket.on('chat_message', handleMessage);
    socket.on('chat_history', handleHistory);

    return () => {
      socket.off('chat_message', handleMessage);
      socket.off('chat_history', handleHistory);
    };
  }, [socket, user, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !user) return;
    socket.emit('chat_message', message.trim());
    setMessage('');
  };

  if (!user) return null; // Only for logged-in users

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      {isOpen && (
        <div className="glass-panel" style={{
          width: '320px',
          height: '400px',
          marginBottom: '16px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--primary)',
          boxShadow: '0 8px 32px rgba(134,196,57,0.3)'
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--primary)',
            color: '#000',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 800
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>💬</span>
              Live Support
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: '20px', padding: 0 }}
            >×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((msg, i) => {
              const isUser = msg.sender === user.id;
              const isAdmin = msg.sender === 'admin';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', marginLeft: '4px', marginRight: '4px' }}>
                    {isAdmin ? 'Support Agent' : isUser ? 'You' : msg.senderName}
                  </div>
                  <div style={{
                    background: isUser ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    color: isUser ? '#000' : '#fff',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    borderBottomRightRadius: isUser ? '2px' : '12px',
                    borderBottomLeftRadius: !isUser ? '2px' : '12px',
                    maxWidth: '85%',
                    wordBreak: 'break-word',
                    fontSize: '13px'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ display: 'flex', padding: '12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ marginLeft: '8px', padding: '10px 16px', borderRadius: '8px' }}>
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pulse-btn"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: 'var(--primary)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(134,196,57,0.4)',
          color: '#000',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        💬
      </button>
    </div>
  );
};

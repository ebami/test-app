import React, { useState, useRef, useEffect } from 'react';
import useSocket from './hooks/useSocket';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
  } = useSocket();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      connect(username.trim());
      setIsJoined(true);
    }
  };

  const handleLeave = () => {
    disconnect();
    setIsJoined(false);
    setUsername('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
      sendTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    sendTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Login screen
  if (!isJoined) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>💬 Socket.io Chat</h1>
          <p>Enter your name to join the chat</p>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button type="submit" disabled={!username.trim()}>
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="app">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-info">
            <h2>💬 Chat Room</h2>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '● Connected' : '○ Disconnected'}
            </span>
          </div>
          <button className="leave-btn" onClick={handleLeave}>
            Leave
          </button>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          {/* Messages */}
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="no-messages">
                No messages yet. Say hello! 👋
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.type === 'system' ? 'system' : ''}`}
              >
                {msg.type === 'system' ? (
                  <span className="system-text">{msg.text}</span>
                ) : (
                  <>
                    <div className="message-header">
                      <span className="username">{msg.username}</span>
                      <span className="timestamp">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </>
                )}
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.map((u) => u.username).join(', ')}{' '}
                {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Users sidebar */}
          <div className="users-sidebar">
            <h3>Online ({users.length})</h3>
            <ul>
              {users.map((user) => (
                <li key={user.id}>
                  <span className="user-dot">●</span> {user.username}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Message input */}
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            disabled={!isConnected}
            autoFocus
          />
          <button type="submit" disabled={!isConnected || !messageInput.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;

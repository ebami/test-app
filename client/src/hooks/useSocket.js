import { useEffect, useState, useCallback } from 'react';
import socket from '../socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    // Connection handlers
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // Message handler
    const onMessageReceived = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    // User list handler
    const onUsersList = (userList) => {
      setUsers(userList);
    };

    // User joined handler
    const onUserJoined = ({ id, username, userCount }) => {
      setUsers((prev) => [...prev, { id, username }]);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: `${username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // User left handler
    const onUserLeft = ({ id, username }) => {
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setTypingUsers((prev) => prev.filter((user) => user.userId !== id));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          text: `${username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing indicator handler
    const onUserTyping = ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, username }];
          }
          return prev;
        } else {
          return prev.filter((u) => u.userId !== userId);
        }
      });
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:received', onMessageReceived);
    socket.on('users:list', onUsersList);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    socket.on('user:typing', onUserTyping);

    // Cleanup on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:received', onMessageReceived);
      socket.off('users:list', onUsersList);
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
      socket.off('user:typing', onUserTyping);
    };
  }, []);

  // Connect and join with username
  const connect = useCallback((username) => {
    socket.connect();
    socket.emit('user:join', username);
  }, []);

  // Disconnect from server
  const disconnect = useCallback(() => {
    socket.disconnect();
    setMessages([]);
    setUsers([]);
  }, []);

  // Send a message
  const sendMessage = useCallback((text) => {
    socket.emit('message:send', { text });
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    socket.emit('user:typing', isTyping);
  }, []);

  return {
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
  };
}

export default useSocket;

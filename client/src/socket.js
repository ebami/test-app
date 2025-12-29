import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

// Create socket instance with reconnection settings
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection event listeners for debugging
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

export default socket;

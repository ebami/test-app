require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { setupSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

// CORS configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: clientUrl,
  methods: ['GET', 'POST']
}));

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST']
  }
});

// Express middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Setup Socket.io event handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accepting connections from: ${clientUrl}`);
});

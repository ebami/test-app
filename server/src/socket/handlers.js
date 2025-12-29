// Store connected users
const users = new Map();

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining with a username
    socket.on('user:join', (username) => {
      users.set(socket.id, { id: socket.id, username });
      console.log(`${username} joined the chat`);
      
      // Notify all clients about the new user
      io.emit('user:joined', { 
        id: socket.id, 
        username,
        userCount: users.size 
      });
      
      // Send current user list to the new user
      socket.emit('users:list', Array.from(users.values()));
    });

    // Handle chat messages
    socket.on('message:send', (data) => {
      const user = users.get(socket.id);
      if (user) {
        const message = {
          id: Date.now(),
          userId: socket.id,
          username: user.username,
          text: data.text,
          timestamp: new Date().toISOString()
        };
        
        // Broadcast message to all connected clients
        io.emit('message:received', message);
        console.log(`Message from ${user.username}: ${data.text}`);
      }
    });

    // Handle typing indicator
    socket.on('user:typing', (isTyping) => {
      const user = users.get(socket.id);
      if (user) {
        socket.broadcast.emit('user:typing', { 
          userId: socket.id, 
          username: user.username, 
          isTyping 
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        console.log(`${user.username} disconnected`);
        users.delete(socket.id);
        
        // Notify all clients about the disconnection
        io.emit('user:left', { 
          id: socket.id, 
          username: user.username,
          userCount: users.size 
        });
      }
    });
  });
}

module.exports = { setupSocketHandlers };

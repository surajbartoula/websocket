const fastify = require('fastify')({ logger: true });

// Register WebSocket plugin
fastify.register(require('@fastify/websocket'));

// Store connected clients
const clients = new Set();

// Serve static files
fastify.register(require('@fastify/static'), {
  root: __dirname,
  prefix: '/'
});

// WebSocket route
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    console.log('Client connected');
    clients.add(socket);
    
    socket.on('message', (message) => {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);
      
      // Broadcast to all connected clients
      clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'message',
            text: data.text,
            timestamp: new Date().toLocaleTimeString()
          }));
        }
      });
    });
    
    socket.on('close', () => {
      console.log('Client disconnected');
      clients.delete(socket);
    });
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
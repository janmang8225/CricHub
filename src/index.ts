import app from "./app.js";
import { env } from "./config/env.js";
import { createServer } from 'http'; // native
import { initializeWebSocket } from './websocket/websocket.server.js';

// Create HTTP server from Express app
const server = createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Start server
server.listen(env.PORT, () => {
  console.log(`HTTP Server running on port ${env.PORT}`);
  console.log(`WebSocket Server available at ws://localhost:${env.PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});




// both are os signals
// sigint = ctrl+c (in terminal obv)
// sigterm = docker stop      |OR| 
//           pm2 restart      |OR| 
//           server shutdown  |OR|
//           cloud provider kills instance (very bad)
// stop accepting new connection, naturally waits for old ones to stop




// no more, only for http
// app.listen(env.PORT, () => {
//   console.log(`Server running on ${env.PORT}`);
// });

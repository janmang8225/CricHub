// src/websocket/websocket.server.ts

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { RoomManager, startHeartbeat } from './websocket.utils.js';
import { handleClientMessage } from './websocket.handlers.js';
import type{ WebSocketClient } from './websocket.types.js';

let roomManager: RoomManager;
let wss: WebSocketServer;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server: HTTPServer): WebSocketServer {
  roomManager = new RoomManager();
  
  wss = new WebSocketServer({
    server,
    path: '/ws', // WebSocket endpoint: ws://localhost:PORT/ws
  });

  console.log('WebSocket server initialized at /ws');

  wss.on('connection', (ws: WebSocket, request) => {
    console.log('New WebSocket connection');

    // Create client object
    const client: WebSocketClient = {
      ws,
      isAlive: true,
    };

    // Heartbeat - pong response
    ws.on('pong', () => {
      client.isAlive = true;
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(client, message, roomManager);
      } catch (error) {
        console.error('Invalid message format:', error);
        ws.send(JSON.stringify({
          type: 'match:error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString(),
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
      roomManager.removeClient(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      roomManager.removeClient(ws);
    });
  });

  // Start heartbeat to detect dead connections
  startHeartbeat(roomManager, 30000); // 30 seconds

  return wss;
}

/**
 * Get the RoomManager instance (for use in services)
 */
export function getRoomManager(): RoomManager {
  if (!roomManager) {
    throw new Error('WebSocket server not initialized');
  }
  return roomManager;
}

/**
 * Get the WebSocketServer instance
 */
export function getWebSocketServer(): WebSocketServer {
  if (!wss) {
    throw new Error('WebSocket server not initialized');
  }
  return wss;
}
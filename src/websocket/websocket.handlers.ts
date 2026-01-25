// src/websocket/websocket.handlers.ts

import type{ WebSocketClient, ClientMessage, ConnectionAckEvent, ErrorEvent } from './websocket.types.js';
import { RoomManager, sendToClient } from './websocket.utils.js';

/**
 * Handle messages received from clients
 */
export function handleClientMessage(
  client: WebSocketClient,
  message: ClientMessage,
  roomManager: RoomManager
): void {
  try {
    switch (message.type) {
      case 'join_match':
        handleJoinMatch(client, message.matchId, message.userId, roomManager);
        break;

      case 'leave_match':
        handleLeaveMatch(client, message.matchId, roomManager);
        break;

      case 'ping':
        handlePing(client);
        break;

      default:
        sendError(client, 'Unknown message type');
    }
  } catch (error: any) {
    console.error('Error handling client message:', error);
    sendError(client, error.message || 'Internal server error');
  }
}

/**
 * Handle client joining a match room
 */
function handleJoinMatch(
  client: WebSocketClient,
  matchId: string,
  userId: string | undefined,
  roomManager: RoomManager
): void {
  if (!matchId) {
    sendError(client, 'matchId is required');
    return;
  }

  // Leave previous room if any
  if (client.matchId) {
    roomManager.leaveRoom(client.matchId, client);
  }

  // Join new room
  if (userId !== undefined) client.userId = userId;

//   client.userId = userId;
  roomManager.joinRoom(matchId, client);

  // Send acknowledgment
  const ackEvent: ConnectionAckEvent = {
    type: 'match:connection_ack',
    matchId,
    message: `Successfully joined match ${matchId}`,
    timestamp: new Date().toISOString(),
  };

  sendToClient(client, ackEvent);
  
  console.log(`Client ${userId || 'anonymous'} joined match:${matchId}`);
}

/**
 * Handle client leaving a match room
 */
function handleLeaveMatch(
  client: WebSocketClient,
  matchId: string,
  roomManager: RoomManager
): void {
  if (!matchId) {
    sendError(client, 'matchId is required');
    return;
  }

  roomManager.leaveRoom(matchId, client);
  
  console.log(`Client left match:${matchId}`);
}

/**
 * Handle ping message (for keepalive)
 */
function handlePing(client: WebSocketClient): void {
  client.isAlive = true;
  
  if (client.ws.readyState === 1) { // WebSocket.OPEN
    client.ws.send(JSON.stringify({
      type: 'pong',
      timestamp: new Date().toISOString(),
    }));
  }
}

/**
 * Send error message to client
 */
function sendError(client: WebSocketClient, message: string): void {
  const errorEvent: ErrorEvent = {
    type: 'match:error',
    message,
    timestamp: new Date().toISOString(),
  };

  sendToClient(client, errorEvent);
}
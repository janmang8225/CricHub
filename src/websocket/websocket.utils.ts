// src/websocket/websocket.utils.ts

import type{ WebSocketClient, ServerEvent } from './websocket.types.js';

// Room management (since ws doesn't have built-in rooms like socket.io)
export class RoomManager {
  // Map of matchId -> Set of WebSocket clients
  private rooms: Map<string, Set<WebSocketClient>> = new Map();

  // Map of WebSocket -> client info for quick lookup
  private clients: Map<any, WebSocketClient> = new Map();

  /**
   * Add a client to a room
   */
  joinRoom(matchId: string, client: WebSocketClient): void {
    if (!this.rooms.has(matchId)) {
      this.rooms.set(matchId, new Set());
    }
    
    this.rooms.get(matchId)!.add(client);
    this.clients.set(client.ws, client);
    client.matchId = matchId;
    
    console.log(`Client joined room: match:${matchId}`);
  }

  /**
   * Remove a client from a room
   */
  leaveRoom(matchId: string, client: WebSocketClient): void {
    const room = this.rooms.get(matchId);
    if (room) {
      room.delete(client);
      if (room.size === 0) {
        this.rooms.delete(matchId);
      }
    }
    
    // client.matchId = undefined;
    delete client.matchId; // it works :) but idk how
    console.log(`Client left room: match:${matchId}`);
  }

  /**
   * Remove a client from all rooms
   */
  removeClient(ws: any): void {
    const client = this.clients.get(ws);
    if (client && client.matchId) {
      this.leaveRoom(client.matchId, client);
    }
    this.clients.delete(ws);
  }

  /**
   * Get all clients in a room
   */
  getClientsInRoom(matchId: string): Set<WebSocketClient> {
    return this.rooms.get(matchId) || new Set();
  }

  /**
   * Get client by WebSocket
   */
  getClient(ws: any): WebSocketClient | undefined {
    return this.clients.get(ws);
  }

  /**
   * Get total number of rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get total number of clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get number of clients in a specific room
   */
  getRoomSize(matchId: string): number {
    return this.rooms.get(matchId)?.size || 0;
  }
}

/**
 * Broadcast an event to all clients in a room
 */
export function broadcastToRoom(
  roomManager: RoomManager,
  matchId: string,
  event: ServerEvent
): void {
  const clients = roomManager.getClientsInRoom(matchId);
  const message = JSON.stringify(event);
  
  let successCount = 0;
  let failCount = 0;

  clients.forEach((client) => {
    if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
      try {
        client.ws.send(message);
        successCount++;
      } catch (error) {
        console.error(`Failed to send to client:`, error);
        failCount++;
      }
    }
  });

  console.log(`Broadcast ${event.type} to match:${matchId} - Success: ${successCount}, Failed: ${failCount}`);
}

/**
 * Send event to a single client
 */
export function sendToClient(client: WebSocketClient, event: ServerEvent): void {
  if (client.ws.readyState === 1) { // WebSocket.OPEN
    try {
      client.ws.send(JSON.stringify(event));
    } catch (error) {
      console.error('Failed to send to client:', error);
    }
  }
}

/**
 * Heartbeat/Ping mechanism to detect dead connections
 */
export function startHeartbeat(roomManager: RoomManager, interval: number = 30000): NodeJS.Timeout {
  return setInterval(() => {
    const clients = Array.from(roomManager['clients'].values());
    
    clients.forEach((client) => {
      if (!client.isAlive) {
        console.log('Terminating dead connection');
        client.ws.terminate();
        roomManager.removeClient(client.ws);
        return;
      }
      
      client.isAlive = false;
      if (client.ws.readyState === 1) {
        client.ws.ping();
      }
    });
  }, interval);
}

/**
 * Calculate strike rate for batting stats
 */
export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

/**
 * Calculate economy rate for bowling stats
 */
export function calculateEconomy(runs: number, balls: number): number {
  if (balls === 0) return 0;
  const overs = balls / 6;
  if (overs === 0) return 0;
  return parseFloat((runs / overs).toFixed(2));
}

/**
 * Convert legal balls to overs format (e.g., 45 balls = 7.3 overs)
 */
export function ballsToOvers(balls: number): number {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return parseFloat(`${overs}.${remainingBalls}`);
}
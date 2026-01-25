import type { WebSocketClient, ServerEvent } from './websocket.types.js';
export declare class RoomManager {
    private rooms;
    private clients;
    /**
     * Add a client to a room
     */
    joinRoom(matchId: string, client: WebSocketClient): void;
    /**
     * Remove a client from a room
     */
    leaveRoom(matchId: string, client: WebSocketClient): void;
    /**
     * Remove a client from all rooms
     */
    removeClient(ws: any): void;
    /**
     * Get all clients in a room
     */
    getClientsInRoom(matchId: string): Set<WebSocketClient>;
    /**
     * Get client by WebSocket
     */
    getClient(ws: any): WebSocketClient | undefined;
    /**
     * Get total number of rooms
     */
    getRoomCount(): number;
    /**
     * Get total number of clients
     */
    getClientCount(): number;
    /**
     * Get number of clients in a specific room
     */
    getRoomSize(matchId: string): number;
}
/**
 * Broadcast an event to all clients in a room
 */
export declare function broadcastToRoom(roomManager: RoomManager, matchId: string, event: ServerEvent): void;
/**
 * Send event to a single client
 */
export declare function sendToClient(client: WebSocketClient, event: ServerEvent): void;
/**
 * Heartbeat/Ping mechanism to detect dead connections
 */
export declare function startHeartbeat(roomManager: RoomManager, interval?: number): NodeJS.Timeout;
/**
 * Calculate strike rate for batting stats
 */
export declare function calculateStrikeRate(runs: number, balls: number): number;
/**
 * Calculate economy rate for bowling stats
 */
export declare function calculateEconomy(runs: number, balls: number): number;
/**
 * Convert legal balls to overs format (e.g., 45 balls = 7.3 overs)
 */
export declare function ballsToOvers(balls: number): number;
//# sourceMappingURL=websocket.utils.d.ts.map
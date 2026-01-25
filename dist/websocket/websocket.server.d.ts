import { WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import { RoomManager } from './websocket.utils.js';
/**
 * Initialize WebSocket server
 */
export declare function initializeWebSocket(server: HTTPServer): WebSocketServer;
/**
 * Get the RoomManager instance (for use in services)
 */
export declare function getRoomManager(): RoomManager;
/**
 * Get the WebSocketServer instance
 */
export declare function getWebSocketServer(): WebSocketServer;
//# sourceMappingURL=websocket.server.d.ts.map
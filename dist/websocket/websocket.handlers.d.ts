import type { WebSocketClient, ClientMessage } from './websocket.types.js';
import { RoomManager } from './websocket.utils.js';
/**
 * Handle messages received from clients
 */
export declare function handleClientMessage(client: WebSocketClient, message: ClientMessage, roomManager: RoomManager): void;
//# sourceMappingURL=websocket.handlers.d.ts.map
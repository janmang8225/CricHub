// src/websocket/websocket.utils.ts
// Room management (since ws doesn't have built-in rooms like socket.io)
export class RoomManager {
    // Map of matchId -> Set of WebSocket clients
    rooms = new Map();
    // Map of WebSocket -> client info for quick lookup
    clients = new Map();
    /**
     * Add a client to a room
     */
    joinRoom(matchId, client) {
        if (!this.rooms.has(matchId)) {
            this.rooms.set(matchId, new Set());
        }
        this.rooms.get(matchId).add(client);
        this.clients.set(client.ws, client);
        client.matchId = matchId;
        console.log(`Client joined room: match:${matchId}`);
    }
    /**
     * Remove a client from a room
     */
    leaveRoom(matchId, client) {
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
    removeClient(ws) {
        const client = this.clients.get(ws);
        if (client && client.matchId) {
            this.leaveRoom(client.matchId, client);
        }
        this.clients.delete(ws);
    }
    /**
     * Get all clients in a room
     */
    getClientsInRoom(matchId) {
        return this.rooms.get(matchId) || new Set();
    }
    /**
     * Get client by WebSocket
     */
    getClient(ws) {
        return this.clients.get(ws);
    }
    /**
     * Get total number of rooms
     */
    getRoomCount() {
        return this.rooms.size;
    }
    /**
     * Get total number of clients
     */
    getClientCount() {
        return this.clients.size;
    }
    /**
     * Get number of clients in a specific room
     */
    getRoomSize(matchId) {
        return this.rooms.get(matchId)?.size || 0;
    }
}
/**
 * Broadcast an event to all clients in a room
 */
export function broadcastToRoom(roomManager, matchId, event) {
    const clients = roomManager.getClientsInRoom(matchId);
    const message = JSON.stringify(event);
    let successCount = 0;
    let failCount = 0;
    clients.forEach((client) => {
        if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
            try {
                client.ws.send(message);
                successCount++;
            }
            catch (error) {
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
export function sendToClient(client, event) {
    if (client.ws.readyState === 1) { // WebSocket.OPEN
        try {
            client.ws.send(JSON.stringify(event));
        }
        catch (error) {
            console.error('Failed to send to client:', error);
        }
    }
}
/**
 * Heartbeat/Ping mechanism to detect dead connections
 */
export function startHeartbeat(roomManager, interval = 30000) {
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
export function calculateStrikeRate(runs, balls) {
    if (balls === 0)
        return 0;
    return parseFloat(((runs / balls) * 100).toFixed(2));
}
/**
 * Calculate economy rate for bowling stats
 */
export function calculateEconomy(runs, balls) {
    if (balls === 0)
        return 0;
    const overs = balls / 6;
    if (overs === 0)
        return 0;
    return parseFloat((runs / overs).toFixed(2));
}
/**
 * Convert legal balls to overs format (e.g., 45 balls = 7.3 overs)
 */
export function ballsToOvers(balls) {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return parseFloat(`${overs}.${remainingBalls}`);
}
//# sourceMappingURL=websocket.utils.js.map
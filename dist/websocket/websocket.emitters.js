// src/websocket/websocket.emitters.ts
import { getRoomManager } from './websocket.server.js';
import { broadcastToRoom, calculateStrikeRate, calculateEconomy, ballsToOvers } from './websocket.utils.js';
/**
 * Emit score update event
 */
export function emitScoreUpdate(matchId, teamId, runs, wickets, overs, strikerStats, nonStrikerStats, bowlerStats) {
    try {
        const event = {
            type: 'match:score_update',
            matchId,
            teamId,
            runs,
            wickets,
            overs,
            striker: {
                ...strikerStats,
                strikeRate: calculateStrikeRate(strikerStats.runs, strikerStats.balls),
            },
            nonStriker: {
                ...nonStrikerStats,
                strikeRate: calculateStrikeRate(nonStrikerStats.runs, nonStrikerStats.balls),
            },
            bowler: {
                ...bowlerStats,
                overs: ballsToOvers(bowlerStats.balls),
                economy: calculateEconomy(bowlerStats.runsConceded, bowlerStats.balls),
            },
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting score update:', error);
    }
}
/**
 * Emit ball added event
 */
export function emitBallAdded(matchId, innings, over, ball, runsOffBat, extraRuns, isWicket, boundary, isWide, isNoBall) {
    try {
        const event = {
            type: 'match:ball_added',
            matchId,
            innings,
            over,
            ball,
            runsOffBat,
            extraRuns,
            totalRuns: runsOffBat + extraRuns,
            isWicket,
            boundary,
            isWide,
            isNoBall,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting ball added:', error);
    }
}
/**
 * Emit wicket event
 */
export function emitWicket(matchId, wicketType, dismissedPlayerId, wicketNumber, runsAtFall, over, ball) {
    try {
        const event = {
            type: 'match:wicket',
            matchId,
            wicketType,
            dismissedPlayerId,
            wicketNumber,
            runsAtFall,
            over,
            ball,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting wicket:', error);
    }
}
/**
 * Emit over complete event
 */
export function emitOverComplete(matchId, innings, over, runs, wickets, extras) {
    try {
        const event = {
            type: 'match:over_complete',
            matchId,
            innings,
            over,
            runs,
            wickets,
            extras,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting over complete:', error);
    }
}
/**
 * Emit innings end event
 */
export function emitInningsEnd(matchId, innings, reason, target) {
    try {
        const event = {
            type: 'match:innings_end',
            matchId,
            innings,
            reason,
            // target, // won't work, bcoz we have target?: number
            // ...(target !== undefined ? { target } : {}), // works
            timestamp: new Date().toISOString(),
        };
        if (target !== undefined) {
            event.target = target;
        }
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting innings end:', error);
    }
}
/**
 * Emit innings switch event
 */
export function emitInningsSwitch(matchId, newInnings) {
    try {
        const event = {
            type: 'match:innings_switch',
            matchId,
            newInnings,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting innings switch:', error);
    }
}
/**
 * Emit match complete event
 */
export function emitMatchComplete(matchId, result, winnerTeamId, resultMethod, resultMargin) {
    try {
        const event = {
            type: 'match:match_complete',
            matchId,
            result,
            winnerTeamId,
            resultMethod,
            resultMargin,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting match complete:', error);
    }
}
/**
 * Emit milestone event
 */
export function emitMilestone(matchId, playerId, milestoneType, milestoneValue, over, ball) {
    try {
        const event = {
            type: 'match:milestone',
            matchId,
            playerId,
            milestoneType,
            milestoneValue,
            over,
            ball,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting milestone:', error);
    }
}
/**
 * Emit partnership update event
 */
export function emitPartnershipUpdate(matchId, batter1Id, batter2Id, runs, balls) {
    try {
        const event = {
            type: 'match:partnership_update',
            matchId,
            batter1Id,
            batter2Id,
            runs,
            balls,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting partnership update:', error);
    }
}
/**
 * Emit batsman change event
 */
export function emitBatsmanChange(matchId, newBatsmanId, position) {
    try {
        const event = {
            type: 'match:batsman_change',
            matchId,
            newBatsmanId,
            position,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting batsman change:', error);
    }
}
/**
 * Emit bowler change event
 */
export function emitBowlerChange(matchId, bowlerId, over) {
    try {
        const event = {
            type: 'match:bowler_change',
            matchId,
            bowlerId,
            over,
            timestamp: new Date().toISOString(),
        };
        broadcastToRoom(getRoomManager(), matchId, event);
    }
    catch (error) {
        console.error('Error emitting bowler change:', error);
    }
}
//# sourceMappingURL=websocket.emitters.js.map
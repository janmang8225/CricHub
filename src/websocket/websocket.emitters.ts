// src/websocket/websocket.emitters.ts

import { getRoomManager } from './websocket.server.js';
import { broadcastToRoom, calculateStrikeRate, calculateEconomy, ballsToOvers } from './websocket.utils.js';
import type {
  ScoreUpdateEvent,
  BallAddedEvent,
  WicketEvent,
  OverCompleteEvent,
  InningsEndEvent,
  InningsSwitchEvent,
  MatchCompleteEvent,
  MilestoneEvent,
  PartnershipUpdateEvent,
  BatsmanChangeEvent,
  BowlerChangeEvent,
} from './websocket.types.js';

/**
 * Emit score update event
 */
export function emitScoreUpdate(
  matchId: string,
  teamId: string,
  runs: number,
  wickets: number,
  overs: number,
  strikerStats: { id: string; runs: number; balls: number; fours: number; sixes: number },
  nonStrikerStats: { id: string; runs: number; balls: number; fours: number; sixes: number },
  bowlerStats: { id: string; balls: number; runsConceded: number; wickets: number }
): void {
  try {
    const event: ScoreUpdateEvent = {
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
  } catch (error) {
    console.error('Error emitting score update:', error);
  }
}

/**
 * Emit ball added event
 */
export function emitBallAdded(
  matchId: string,
  innings: number,
  over: number,
  ball: number,
  runsOffBat: number,
  extraRuns: number,
  isWicket: boolean,
  boundary: string | null,
  isWide: boolean,
  isNoBall: boolean
): void {
  try {
    const event: BallAddedEvent = {
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
  } catch (error) {
    console.error('Error emitting ball added:', error);
  }
}

/**
 * Emit wicket event
 */
export function emitWicket(
  matchId: string,
  wicketType: string,
  dismissedPlayerId: string,
  wicketNumber: number,
  runsAtFall: number,
  over: number,
  ball: number
): void {
  try {
    const event: WicketEvent = {
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
  } catch (error) {
    console.error('Error emitting wicket:', error);
  }
}

/**
 * Emit over complete event
 */
export function emitOverComplete(
  matchId: string,
  innings: number,
  over: number,
  runs: number,
  wickets: number,
  extras: number
): void {
  try {
    const event: OverCompleteEvent = {
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
  } catch (error) {
    console.error('Error emitting over complete:', error);
  }
}

/**
 * Emit innings end event
 */
export function emitInningsEnd(
  matchId: string,
  innings: number,
  reason: string,
  target?: number
): void {
  try {
    const event: InningsEndEvent = {
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
  } catch (error) {
    console.error('Error emitting innings end:', error);
  }
}

/**
 * Emit innings switch event
 */
export function emitInningsSwitch(matchId: string, newInnings: number): void {
  try {
    const event: InningsSwitchEvent = {
      type: 'match:innings_switch',
      matchId,
      newInnings,
      timestamp: new Date().toISOString(),
    };

    broadcastToRoom(getRoomManager(), matchId, event);
  } catch (error) {
    console.error('Error emitting innings switch:', error);
  }
}

/**
 * Emit match complete event
 */
export function emitMatchComplete(
  matchId: string,
  result: string,
  winnerTeamId: string | null,
  resultMethod: string,
  resultMargin: number
): void {
  try {
    const event: MatchCompleteEvent = {
      type: 'match:match_complete',
      matchId,
      result,
      winnerTeamId,
      resultMethod,
      resultMargin,
      timestamp: new Date().toISOString(),
    };

    broadcastToRoom(getRoomManager(), matchId, event);
  } catch (error) {
    console.error('Error emitting match complete:', error);
  }
}

/**
 * Emit milestone event
 */
export function emitMilestone(
  matchId: string,
  playerId: string,
  milestoneType: string,
  milestoneValue: number,
  over: number,
  ball: number
): void {
  try {
    const event: MilestoneEvent = {
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
  } catch (error) {
    console.error('Error emitting milestone:', error);
  }
}

/**
 * Emit partnership update event
 */
export function emitPartnershipUpdate(
  matchId: string,
  batter1Id: string,
  batter2Id: string,
  runs: number,
  balls: number
): void {
  try {
    const event: PartnershipUpdateEvent = {
      type: 'match:partnership_update',
      matchId,
      batter1Id,
      batter2Id,
      runs,
      balls,
      timestamp: new Date().toISOString(),
    };

    broadcastToRoom(getRoomManager(), matchId, event);
  } catch (error) {
    console.error('Error emitting partnership update:', error);
  }
}

/**
 * Emit batsman change event
 */
export function emitBatsmanChange(
  matchId: string,
  newBatsmanId: string,
  position: 'STRIKER' | 'NON_STRIKER'
): void {
  try {
    const event: BatsmanChangeEvent = {
      type: 'match:batsman_change',
      matchId,
      newBatsmanId,
      position,
      timestamp: new Date().toISOString(),
    };

    broadcastToRoom(getRoomManager(), matchId, event);
  } catch (error) {
    console.error('Error emitting batsman change:', error);
  }
}

/**
 * Emit bowler change event
 */
export function emitBowlerChange(matchId: string, bowlerId: string, over: number): void {
  try {
    const event: BowlerChangeEvent = {
      type: 'match:bowler_change',
      matchId,
      bowlerId,
      over,
      timestamp: new Date().toISOString(),
    };

    broadcastToRoom(getRoomManager(), matchId, event);
  } catch (error) {
    console.error('Error emitting bowler change:', error);
  }
}
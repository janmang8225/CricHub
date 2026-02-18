/**
 * Emit score update event
 */
export declare function emitScoreUpdate(matchId: string, teamId: string, runs: number, wickets: number, overs: number, strikerStats: {
    id: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
}, nonStrikerStats: {
    id: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
}, bowlerStats: {
    id: string;
    balls: number;
    runsConceded: number;
    wickets: number;
}): void;
/**
 * Emit ball added event
 */
export declare function emitBallAdded(matchId: string, innings: number, over: number, ball: number, runsOffBat: number, extraRuns: number, isWicket: boolean, boundary: string | null, isWide: boolean, isNoBall: boolean): void;
/**
 * Emit wicket event
 */
export declare function emitWicket(matchId: string, wicketType: string, dismissedPlayerId: string, wicketNumber: number, runsAtFall: number, over: number, ball: number): void;
/**
 * Emit over complete event
 */
export declare function emitOverComplete(matchId: string, innings: number, over: number, runs: number, wickets: number, extras: number): void;
/**
 * Emit innings end event
 */
export declare function emitInningsEnd(matchId: string, innings: number, reason: string, target?: number): void;
/**
 * Emit innings switch event
 */
export declare function emitInningsSwitch(matchId: string, newInnings: number): void;
/**
 * Emit match complete event
 */
export declare function emitMatchComplete(matchId: string, result: string, winnerTeamId: string | null, resultMethod: string, resultMargin: number): void;
/**
 * Emit milestone event
 */
export declare function emitMilestone(matchId: string, playerId: string, milestoneType: string, milestoneValue: number, over: number, ball: number): void;
/**
 * Emit partnership update event
 */
export declare function emitPartnershipUpdate(matchId: string, batter1Id: string, batter2Id: string, runs: number, balls: number): void;
/**
 * Emit batsman change event
 */
export declare function emitBatsmanChange(matchId: string, newBatsmanId: string, position: 'STRIKER' | 'NON_STRIKER'): void;
/**
 * Emit bowler change event
 */
export declare function emitBowlerChange(matchId: string, bowlerId: string, over: number): void;
//# sourceMappingURL=websocket.emitters.d.ts.map
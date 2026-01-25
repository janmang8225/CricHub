export interface WebSocketClient {
    ws: any;
    userId?: string;
    matchId?: string;
    isAlive: boolean;
}
export type WebSocketEvent = 'match:score_update' | 'match:ball_added' | 'match:wicket' | 'match:over_complete' | 'match:innings_end' | 'match:innings_switch' | 'match:match_complete' | 'match:milestone' | 'match:partnership_update' | 'match:batsman_change' | 'match:bowler_change' | 'match:connection_ack' | 'match:error';
export interface JoinMatchMessage {
    type: 'join_match';
    matchId: string;
    userId?: string;
}
export interface LeaveMatchMessage {
    type: 'leave_match';
    matchId: string;
}
export interface PingMessage {
    type: 'ping';
}
export type ClientMessage = JoinMatchMessage | LeaveMatchMessage | PingMessage;
export interface ScoreUpdateEvent {
    type: 'match:score_update';
    matchId: string;
    teamId: string;
    runs: number;
    wickets: number;
    overs: number;
    striker: {
        id: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        strikeRate: number;
    };
    nonStriker: {
        id: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        strikeRate: number;
    };
    bowler: {
        id: string;
        balls: number;
        overs: number;
        runsConceded: number;
        wickets: number;
        economy: number;
    };
    timestamp: string;
}
export interface BallAddedEvent {
    type: 'match:ball_added';
    matchId: string;
    innings: number;
    over: number;
    ball: number;
    runsOffBat: number;
    extraRuns: number;
    totalRuns: number;
    isWicket: boolean;
    boundary: string | null;
    isWide: boolean;
    isNoBall: boolean;
    timestamp: string;
}
export interface WicketEvent {
    type: 'match:wicket';
    matchId: string;
    wicketType: string;
    dismissedPlayerId: string;
    wicketNumber: number;
    runsAtFall: number;
    over: number;
    ball: number;
    timestamp: string;
}
export interface OverCompleteEvent {
    type: 'match:over_complete';
    matchId: string;
    innings: number;
    over: number;
    runs: number;
    wickets: number;
    extras: number;
    timestamp: string;
}
export interface InningsEndEvent {
    type: 'match:innings_end';
    matchId: string;
    innings: number;
    reason: string;
    target?: number;
    timestamp: string;
}
export interface InningsSwitchEvent {
    type: 'match:innings_switch';
    matchId: string;
    newInnings: number;
    timestamp: string;
}
export interface MatchCompleteEvent {
    type: 'match:match_complete';
    matchId: string;
    result: string;
    winnerTeamId: string | null;
    resultMethod: string;
    resultMargin: number;
    timestamp: string;
}
export interface MilestoneEvent {
    type: 'match:milestone';
    matchId: string;
    playerId: string;
    milestoneType: string;
    milestoneValue: number;
    over: number;
    ball: number;
    timestamp: string;
}
export interface PartnershipUpdateEvent {
    type: 'match:partnership_update';
    matchId: string;
    batter1Id: string;
    batter2Id: string;
    runs: number;
    balls: number;
    timestamp: string;
}
export interface BatsmanChangeEvent {
    type: 'match:batsman_change';
    matchId: string;
    newBatsmanId: string;
    position: 'STRIKER' | 'NON_STRIKER';
    timestamp: string;
}
export interface BowlerChangeEvent {
    type: 'match:bowler_change';
    matchId: string;
    bowlerId: string;
    over: number;
    timestamp: string;
}
export interface ConnectionAckEvent {
    type: 'match:connection_ack';
    matchId: string;
    message: string;
    timestamp: string;
}
export interface ErrorEvent {
    type: 'match:error';
    message: string;
    timestamp: string;
}
export type ServerEvent = ScoreUpdateEvent | BallAddedEvent | WicketEvent | OverCompleteEvent | InningsEndEvent | InningsSwitchEvent | MatchCompleteEvent | MilestoneEvent | PartnershipUpdateEvent | BatsmanChangeEvent | BowlerChangeEvent | ConnectionAckEvent | ErrorEvent;
//# sourceMappingURL=websocket.types.d.ts.map
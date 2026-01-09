export declare function initScoresService(matchId: string): Promise<{
    message: string;
}>;
export declare function updateScoreService(matchId: string, teamId: string, runs?: number, wickets?: number, overs?: number, actor?: {
    userId: string;
    role: string;
}): Promise<any>;
export declare function getScoreService(matchId: string): Promise<any[]>;
export declare function getCurrentInningService(matchId: string): Promise<any[]>;
export declare function startMatchService(matchId: string, tossWinnerTeamId: string, tossDecision: "BAT" | "BOWL"): Promise<void>;
export declare function getBattingStateService(matchId: string): Promise<{
    innings: any;
    battingTeamId: any;
    bowlingTeamId: any;
    strikerId: string | null;
    nonStrikerId: string | null;
    nextBatsmen: any[];
    currentOver: number;
    nextBall: number;
}>;
export declare function setOpenersService(matchId: string, strikerId: string, nonStrikerId: string): Promise<void>;
export declare function setNextBatsmanService(matchId: string, newBatsmanId: string): Promise<void>;
export declare function setBowlerService(matchId: string, over: number, bowlerId: string): Promise<void>;
export declare function updateStrikeService(matchId: string, strikerId: string, nonStrikerId: string): Promise<any>;
//# sourceMappingURL=score.service.d.ts.map
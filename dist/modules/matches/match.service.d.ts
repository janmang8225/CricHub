export declare function createMatchService(teamAId: string, teamBId: string, startTime: string, maxOvers: number, createdBy: string): Promise<any>;
export declare function listMatchesService(page: number, limit: number): Promise<any[]>;
export declare function getMatchService(id: string): Promise<any>;
export declare function assignScorerService(matchId: string, userId: string, assignedBy: string, actorRole: string, actorUserId: string): Promise<{
    message: string;
}>;
export declare function unassignScorerService(matchId: string, userId: string, actorRole: string, actorUserId: string): Promise<{
    message: string;
}>;
export declare function startMatchService(matchId: string): Promise<void>;
export declare function completeMatchService(matchId: string): Promise<{
    result: string;
    winnerTeamId: any;
    resultMethod: string;
    resultMargin: number;
}>;
export declare function setPlayingXIService(matchId: string, teamId: string, players: Array<{
    playerId: string;
    isCaptain: boolean;
    isViceCaptain: boolean;
    isWicketKeeper: boolean;
    isSubstitute: boolean;
}>): Promise<void>;
//# sourceMappingURL=match.service.d.ts.map
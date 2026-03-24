export declare function createMatchService(teamAId: string, teamBId: string, startTime: string, maxOvers: number, createdBy: string, venue?: string): Promise<any>;
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
export declare function getPlayingXIService(matchId: string): Promise<{
    teamA: null;
    teamB: null;
} | {
    teamA: {
        id: any;
        name: any;
        players: {
            id: any;
            name: any;
            isCaptain: any;
            isViceCaptain: any;
            isWicketKeeper: any;
            isSubstitute: any;
            isBatsman: any;
            isBowler: any;
        }[];
    };
    teamB: {
        id: any;
        name: any;
        players: {
            id: any;
            name: any;
            isCaptain: any;
            isViceCaptain: any;
            isWicketKeeper: any;
            isSubstitute: any;
            isBatsman: any;
            isBowler: any;
        }[];
    } | null;
}>;
export declare function setPlayingXIService(matchId: string, teamId: string, players: Array<{
    playerId: string;
    isCaptain: boolean;
    isViceCaptain: boolean;
    isWicketKeeper: boolean;
    isSubstitute: boolean;
}>): Promise<void>;
export declare function listMyMatchesService(userId: string, role: string, page: number, limit: number): Promise<any[]>;
//# sourceMappingURL=match.service.d.ts.map
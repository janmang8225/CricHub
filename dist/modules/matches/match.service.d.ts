export declare function createMatchService(teamAId: string, teamBId: string, startTime: string, createdBy: string): Promise<any>;
export declare function listMatchesService(page: number, limit: number): Promise<any[]>;
export declare function getMatchService(id: string): Promise<any>;
export declare function assignScorerService(matchId: string, userId: string, assignedBy: string): Promise<{
    message: string;
}>;
export declare function unassignScorerService(matchId: string, userId: string): Promise<{
    message: string;
}>;
export declare function startMatchService(matchId: string): Promise<void>;
export declare function completeMatchService(matchId: string): Promise<void>;
//# sourceMappingURL=match.service.d.ts.map
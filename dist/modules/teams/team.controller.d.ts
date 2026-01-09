import type { Request, Response, NextFunction } from "express";
export declare function createTeam(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTeams(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPlayersByTeam(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addPlayerToTeam(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deactivatePlayerFromTeam(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=team.controller.d.ts.map
import type { Request, Response, NextFunction } from "express";
export declare function assignScorer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function unassignScorer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createMatch(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listMatches(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMatch(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function startMatchController(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function completeMatchController(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setPlayingXI(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=match.controller.d.ts.map
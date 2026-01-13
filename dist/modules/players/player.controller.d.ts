import type { Request, Response, NextFunction } from "express";
export declare function createPlayer(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPlayers(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updatePlayerRole(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=player.controller.d.ts.map
import type { Request, Response, NextFunction } from "express";
export declare function withCache(seconds: number): (_req: Request, res: Response, next: NextFunction) => void;
export declare function withETag(req: Request, res: Response, body: any): boolean;
//# sourceMappingURL=cache.middleware.d.ts.map
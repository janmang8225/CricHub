import type { Request, Response } from "express";
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const publicRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authenticatedRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const scoringRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminWriteRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const inningsControlRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare function combineRateLimits(...limiters: any[]): (req: Request, res: Response, next: Function) => void;
//# sourceMappingURL=rateLimit.middleware.d.ts.map
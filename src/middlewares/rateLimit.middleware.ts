import rateLimit from "express-rate-limit";
import type{ Request, Response } from "express";

function getKeyGenerator(
  useUserId: boolean = false,
  includeMatchId: boolean = false
) {
  return (req: Request): string => {
    if (useUserId && (req as any).user?.userId) {
      const userId = (req as any).user.userId;

      if (includeMatchId && req.params.id) {
        return `user:${userId}:match:${req.params.id}`;
      }

      return `user:${userId}`;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (includeMatchId && req.params.id) {
      return `ip:${ip}:match:${req.params.id}`;
    }

    return `ip:${ip}`;
  };
}

const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// =========================================

// 1. AUTH RATE LIMIT
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min = 5 req (change if required)
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKeyGenerator(false, false),
});

// 2. PUBLIC READ RATE LIMIT
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // might extend (if more calls)
  max: 1000, // 1000 req = per ip / min (extend, or either reduce time) (prob for campus students)
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKeyGenerator(false, false),
});

// 3. AUTHENTICATED READ RATE LIMIT
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKeyGenerator(true, false),
});

// 4. SCORING RATE LIMIT
export const scoringRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKeyGenerator(true, true),
  skip: (req) => {
    const user = (req as any).user;
    return !(user && (user.role === 'SCORER' || user.role === 'ADMIN'));
  },
});

// 5. ADMIN MUTATIONS RATE LIMIT
export const adminWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKeyGenerator(true, false),
  skip: (req) => {
    const user = (req as any).user;
    return !(user && user.role === 'ADMIN');
  },
});

// 6. INNINGS CONTROL RATE LIMIT
export const inningsControlRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKeyGenerator(true, true),
  skip: (req) => {
    const user = (req as any).user;
    return !(user && (user.role === 'SCORER' || user.role === 'ADMIN'));
  },
});


// helper - combine multiplw
export function combineRateLimits(...limiters: any[]) {
  return (req: Request, res: Response, next: Function) => {
    let index = 0;
    
    const executeNext = () => {
      if (index >= limiters.length) {
        return next();
      }
      
      const limiter = limiters[index++];
      limiter(req, res, executeNext);
    };
    
    executeNext();
  };
}

// export const publicRateLimiter = rateLimit({
//     windowMs: 60*1000,
//     max: 60,
//     standardHeaders: true,
//     legacyHeaders: false
// })

// windowMs = time window (1 min)
// max = max req in above window
// means, 60 req in 60*1000 (1 min)

// std header: send rate limit info in res header
// leg header: disable old rate limit header (idk y)

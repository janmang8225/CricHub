import rateLimit from "express-rate-limit";

export const publicRateLimiter = rateLimit({
    windowMs: 60*1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
})

// windowMs = time window (1 min)
// max = max req in above window
// means, 60 req in 60*1000 (1 min)

// std header: send rate limit info in res header
// leg header: disable old rate limit header (idk y)

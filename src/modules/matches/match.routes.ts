// match.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createMatch, listMatches, getMatch, setPlayingXI, getPlayingXI, listMyMatches } from "./match.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  assignScorer,
  unassignScorer,
} from "./match.controller.js";
import { withCache } from "../../middlewares/cache.middleware.js";
import { 
  adminWriteRateLimiter, 
  publicRateLimiter, 
  authenticatedRateLimiter, 
  inningsControlRateLimit } from "../../middlewares/rateLimit.middleware.js";
import { submitBall } from "../ball/ball.controller.js";
import { switchInnings } from "../innings/innings.controller.js";

const router = Router();

// change2
router.get("/my-matches", authMiddleware, requireRole(["ADMIN", "CREATOR"]), authenticatedRateLimiter, listMyMatches);

router.post("/", authMiddleware, requireRole(["ADMIN", "CREATOR"]), authenticatedRateLimiter, createMatch); 
router.get("/", publicRateLimiter, withCache(5), listMatches);

router.post("/:id/scorers", authMiddleware, requireRole(["ADMIN", "CREATOR"]), authenticatedRateLimiter, assignScorer);
router.post("/:id/balls", authMiddleware, submitBall);
router.post("/:id/innings/switch", authMiddleware, requireRole(["ADMIN", "SCORER", "CREATOR"]), inningsControlRateLimit, switchInnings);

router.patch("/:id/scorers/:userId/deactivate", authMiddleware, requireRole(["ADMIN", "CREATOR"]),authenticatedRateLimiter, unassignScorer);
router.get("/:id", publicRateLimiter, withCache(5), getMatch);

// change2
router.get("/:id/playing-xi", publicRateLimiter, withCache(5), getPlayingXI);

// change1
router.post("/:id/playing-xi", authMiddleware, requireRole(["ADMIN", "CREATOR"]), authenticatedRateLimiter, setPlayingXI);
// to call this route, use this format:
/*
{
  "teamId": "uuid",
  "players": [
    { "playerId": "uuid1", "isCaptain": true, "isViceCaptain": false, "isWicketKeeper": false, "isSubstitute": false },
    { "playerId": "uuid2", "isCaptain": false, "isViceCaptain": true, "isWicketKeeper": false, "isSubstitute": false },
    { "playerId": "uuid3", "isCaptain": false, "isViceCaptain": false, "isWicketKeeper": true, "isSubstitute": false },
    ... (8 more players)
  ]
}
*/

export default router;

// match.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createMatch, listMatches, getMatch, setPlayingXI } from "./match.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  assignScorer,
  unassignScorer,
} from "./match.controller.js";
import { withCache } from "../../middlewares/cache.middleware.js";
import { publicRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { submitBall } from "../ball/ball.controller.js";
import { switchInnings } from "../innings/innings.controller.js";

const router = Router();

router.post("/", authMiddleware, requireRole(["ADMIN"]), createMatch); 
router.get("/", publicRateLimiter, withCache(5), listMatches);

router.post("/:id/scorers", authMiddleware, requireRole(["ADMIN"]), assignScorer);
router.post("/:id/balls", authMiddleware, submitBall);
router.post("/:id/innings/switch", authMiddleware, switchInnings);

router.patch("/:id/scorers/:userId/deactivate", authMiddleware, requireRole(["ADMIN"]), unassignScorer);
router.get("/:id", publicRateLimiter, withCache(5), getMatch);

// change1
router.post("/:id/playing-xi", authMiddleware, requireRole(["ADMIN"]), setPlayingXI);
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

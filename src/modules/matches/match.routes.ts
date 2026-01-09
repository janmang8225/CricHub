// match.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createMatch, listMatches, getMatch } from "./match.controller.js";
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

export default router;

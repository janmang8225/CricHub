// score.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { initScores, updateScore, getScore, startMatch, getCurrentInning, getBattingState, setOpeners, setNextBatsman, setBowler, updateStrikeController } from "./score.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { withCache } from "../../middlewares/cache.middleware.js";
const router = Router();
router.post("/matches/:id/scores/init", authMiddleware, requireRole(["ADMIN"]), initScores);
router.patch("/matches/:id/scores", authMiddleware, requireRole(["SCORER", "ADMIN"]), updateScore);
router.get("/matches/:id/score", withCache(2), getScore);
router.get("/matches/:id/current-inning", getCurrentInning);
router.get("/matches/:id/batting-state", authMiddleware, requireRole(["ADMIN", "SCORER"]), getBattingState);
// select openers (once per innings)
router.post("/matches/:id/openers", authMiddleware, requireRole(["SCORER", "ADMIN"]), setOpeners);
router.post("/matches/:id/batting-state/update-strike", authMiddleware, requireRole(["SCORER", "ADMIN"]), updateStrikeController);
// after wicket, select next batsman
router.post("/matches/:id/next-batsman", authMiddleware, requireRole(["SCORER", "ADMIN"]), setNextBatsman);
router.post("/matches/:id/overs/:over/bowler", authMiddleware, requireRole(["SCORER", "ADMIN"]), setBowler);
router.post("/matches/:id/start", authMiddleware, requireRole(["ADMIN"]), startMatch);
export default router;
//# sourceMappingURL=score.routes.js.map
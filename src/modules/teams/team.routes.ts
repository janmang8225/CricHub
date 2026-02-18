// team.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createTeam,
  getTeams,
  addPlayerToTeam,
  getPlayersByTeam,
  deactivatePlayerFromTeam,
} from "./team.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { withCache } from "../../middlewares/cache.middleware.js";

const router = Router();

router.post("/", authMiddleware, requireRole(["ADMIN", "CREATOR"]), createTeam);
router.get("/", authMiddleware, getTeams);
router.get("/:teamId/players", withCache(30), getPlayersByTeam);
router.post("/:teamId/players/:playerId", authMiddleware, requireRole(["ADMIN", "CREATOR"]), addPlayerToTeam);
router.patch("/:teamId/players/:playerId/deactivate", authMiddleware, requireRole(["ADMIN", "CREATOR"]), deactivatePlayerFromTeam);

export default router;

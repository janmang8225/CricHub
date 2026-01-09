// player.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createPlayer, getPlayers } from "./player.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, requireRole(["ADMIN"]), createPlayer);
router.get("/", authMiddleware, getPlayers);

export default router;

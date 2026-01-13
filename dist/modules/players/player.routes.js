// player.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createPlayer, getPlayers, updatePlayerRole } from "./player.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";
const router = Router();
router.post("/", authMiddleware, requireRole(["ADMIN"]), createPlayer);
router.get("/", authMiddleware, getPlayers);
// change1
router.patch("/:id/role", authMiddleware, requireRole(["ADMIN"]), updatePlayerRole);
export default router;
//# sourceMappingURL=player.routes.js.map